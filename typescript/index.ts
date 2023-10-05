/**
 * This code is used in Flatfile's Beginner Tutorial
 * https://flatfile.com/docs/quickstart
 *
 * To see all of Flatfile's code examples go to: https://github.com/FlatFilers/flatfile-docs-kitchen-sink
 */

import { recordHook, FlatfileRecord } from "@flatfile/plugin-record-hook";
import { Client, FlatfileEvent } from "@flatfile/listener";
import api from "@flatfile/api";
import axios from "axios";
import properCase from "proper-case";
import { automap } from "@flatfile/plugin-automap";

// Part 1: Create a Workbook (https://flatfile.com/docs/quickstart/meet-the-workbook)
// If you haven't completed step one in, you can run `npm run create-workbook`

const webhookReceiver = process.env.WEBHOOK_SITE_URL || "https://webhook.site/ae74b7ec-cbdb-40f8-af07-6b203a858b82"; // TODO: Update this with your webhook.site URL for Part 4

export default function flatfileEventListener(listener: Client) {
  // Part 2: Setup a listener (https://flatfile.com/docs/quickstart/meet-the-listener)
  listener.on("**", (event: FlatfileEvent) => {
    // Log all events
    console.log(`Received event: ${event.topic}`);
  });

  // Part 3: Transform and validate (https://flatfile.com/docs/quickstart/add-data-transformation)
  listener.use(
    recordHook("members", (record: FlatfileRecord) => {
      
      // FIRST NAME
      const fNameVal = record.get("firstName");
      if (typeof fNameVal === "string") {
        record.set("firstName", properCase(fNameVal));
      } else {
        record.addError("firstName", "Invalid first name");
      }
    
      // LAST NAME
      const lNameVal = record.get("lastName");
      if (typeof lNameVal === "string") {
        record.set("lastName", properCase(lNameVal));
      } else {
        record.addError("lastName", "Invalid last name");
      }

      // EMAIL ADDRESS
      const email = record.get("email") as string;
      const validEmailAddress = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!validEmailAddress.test(email)) {
        console.log("Invalid email address");
        record.addError("email", "Invalid email address");
      }

      return record;
    })
  );


  // FILE UPLOAD HANDLERS
  listener.use(
    automap({
      accuracy: "confident",
      defaultTargetSheet: "Organizations",
      matchFilename: /^.*organizations\.csv$/,
      onFailure: (event) => {
        console.error(
          `Failed to automap! Please visit https://spaces.flatfile.com/space/${event.context.spaceId}/files?mode=import to manually import file.`
        );
      },
    })
  );
  listener.use(
    automap({
      accuracy: "confident",
      defaultTargetSheet: "Members",
      matchFilename: /^.*members\.csv$/,
      onFailure: (event) => {
        console.error(
          `Failed to automap! Please visit https://spaces.flatfile.com/space/${event.context.spaceId}/files?mode=import to manually import file.`
        );
      },
    })
  );

  // Part 4: Configure a submit Action (https://flatfile.com/docs/quickstart/submit-action)
  listener
    .filter({ job: "workbook:submitAction" })
    .on("job:ready", async (event: FlatfileEvent) => {

      const { context, payload } = event;
      const { jobId, workbookId } = context;

      // Acknowledge the job
      try {
        await api.jobs.ack(jobId, {
          info: "Starting job to submit action to webhook.site",
          progress: 10,
        });

        // Collect all Sheet and Record data from the Workbook
        const { data: sheets } = await api.sheets.list({ workbookId });
        const records: { [name: string]: any } = {};
        for (const [index, element] of sheets.entries()) {
          records[`Sheet[${index}]`] = await api.records.get(element.id);
        }

        console.log(JSON.stringify(records, null, 2));

        // Send the data to our webhook.site URL
        const response = await axios.post(
          webhookReceiver,
          {
            ...payload,
            method: "axios",
            sheets,
            records,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // If the call fails throw an error
        if (response.status !== 200) {
          throw new Error("Failed to submit data to webhook.site");
        }

        // Otherwise, complete the job
        await api.jobs.complete(jobId, {
          outcome: {
            message: `Data was successfully submitted to Webhook.site. Go check it out at ${webhookReceiver}.`,
          },
        });
      } catch (error) {
        // If an error is thrown, fail the job
        console.log(`webhook.site[error]: ${JSON.stringify(error, null, 2)}`);
        await api.jobs.fail(jobId, {
          outcome: {
            message: `This job failed. Check your ${webhookReceiver}.`,
          },
        });
      }
    });
}
