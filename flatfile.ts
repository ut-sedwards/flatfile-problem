import { recordHook, FlatfileRecord } from "@flatfile/plugin-record-hook";
import { Client, FlatfileEvent } from "@flatfile/listener";
import * as workbook from "./processors/workbook";
import * as space from "./processors/space";

import api from "@flatfile/api";

const debug = process.env.DEBUG || false;

export default function flatfileEventListener(listener: Client) {
  if (debug === "true") {
    listener.on("**", (event: FlatfileEvent) => {
      console.log(`Received event: ${event.topic}`);
    });
  }

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

  // SPACE CONFIGURATION
  listener
    .filter({ job: "space:configure" })
    .on("job:ready", async (event: FlatfileEvent) => {
      space.configure(event.context);
    });

  // APPLY THEME
  listener.on(
    "space:created",
    async ({ context: { spaceId, environmentId } }) => {
      space.theme(spaceId, environmentId);
    }
  );
}
