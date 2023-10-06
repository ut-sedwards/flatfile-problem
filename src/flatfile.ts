import { recordHook, FlatfileRecord } from "@flatfile/plugin-record-hook";
import { Client, FlatfileEvent } from "@flatfile/listener";
import * as workbook from "./processors/workbook";
import * as space from "./processors/space";

export default function flatfileEventListener(listener: Client) {
  listener.on("**", (event: FlatfileEvent) => {
    console.log(`Received event: ${event.topic}`);
  });

  // SPACE CONFIGURATION
  listener
    .filter({ job: "space:configure" })
    .on("job:ready", async (event: FlatfileEvent) => {
      space.configure(event.context);
    });

  // MEMBERS SHEET
  listener.use(
    recordHook("members", (record: FlatfileRecord) => {
      workbook.processMembers(record);
    })
  );

  // MEMBER_NOTES SHEET
  listener.use(
    recordHook("notes", (record: FlatfileRecord) => {
      workbook.processNotes(record);
    })
  );

  // // APPLY THEME
  // listener.on(
  //   "space:configure",
  //   async ({ context: { spaceId, environmentId } }) => {
  //     space.theme(spaceId, environmentId);
  //   }
  // );
}
