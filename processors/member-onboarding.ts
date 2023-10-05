import { recordHook, FlatfileRecord } from "@flatfile/plugin-record-hook";
import { Client, FlatfileEvent } from "@flatfile/listener";
import api from "@flatfile/api";
import axios from "axios";
import { automap } from "@flatfile/plugin-automap";
import * as transform from "../scripts/transform";
import * as validate from "../scripts/validate";

const webhookReceiver = process.env.WEBHOOK_SITE_URL || "https://webhook.site/ae74b7ec-cbdb-40f8-af07-6b203a858b82";

export default function flatfileEventListener(listener: Client) {

  listener.on("**", (event: FlatfileEvent) => {
    console.log(`Received event: ${event.topic}`);
  });

  // MEMBERS SHEET
  listener.use(
    recordHook("members", (record: FlatfileRecord) => {
      
      transform.properName(record, "firstName");
      
      transform.properName(record, "lastName");
  
      transform.email(record, "email");
      validate.email(record, "email");
      
      return record;
    })
  );

  // MEMBER_NOTES SHEET
  listener.use(
    recordHook("notes", (record: FlatfileRecord) => {
      
      validate.date(record, "date");
      transform.date(record, "date");
      
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


  // SUBMIT ACTIONS
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

    listener
    .filter({ job: "space:configure" })
    .on("job:ready", async (event: FlatfileEvent) => {
      const { spaceId, environmentId, jobId } = event.context;
      try {
        await api.jobs.ack(jobId, {
          info: "Preparing Space",
          progress: 10,
        });

        await api.workbooks.create({
          spaceId,
          environmentId,
          name: "Membership Import Data",
          labels: ["pinned"],
          sheets: [
            {
              name: "Organizations",
              slug: "organizations",
              fields: [
                {
                  key: "orgId",
                  type: "string",
                  label: "Org ID",
                },
                {
                  key: "orgCountry",
                  label: "Country",
                  type: "enum",
                  config: {
                    options: [
                      {
                        value: "us",
                        label: "United States",
                      },
                      {
                        value: "ca",
                        label: "Canada",
                      }
                    ]
                  }
                },
                {
                  key: "orgName",
                  type: "string",
                  label: "Org Name",
                },
                {
                  key: "orgAddress",
                  type: "string",
                  label: "Street Address",
                },
                {
                  key: "orgCity",
                  type: "string",
                  label: "City",
                },
                {
                  key: "orgState",
                  type: "string",
                  label: "State",
                },
                {
                  key: "orgPostal",
                  type: "string",
                  label: "Postal",
                },
              ],
            },
            {
              name: "Members",
              slug: "members",
              fields: [
                {
                  key: "identifier",
                  type: "string",
                  label: "ID",
                  constraints: [{type: "required"}, {type: "unique"}]
                },
                {
                  key: "orgID",
                  type: "reference",
                  label: "Organization ID",
                  constraints: [{type: "required"}],
                  "config": {
                    "ref": "organizations",
                    "key": "orgId",
                    "relationship": "has-one"
                  }
                },
                {
                  key: "firstName",
                  type: "string",
                  label: "First Name",
                  constraints: [{type: "required"}]
                },
                {
                  key: "lastName",
                  type: "string",
                  label: "Last Name",
                  constraints: [{type: "required"}]
                },
                {
                  key: "email",
                  type: "string",
                  label: "Email",
                  constraints: [{type: "unique"}]
                },
              ],
            },
            {
              name: "Notes",
              slug: "notes",
              fields: [
                {
                  key: "memberId",
                  type: "string",
                  label: "Member ID",
                },
                {
                  key: "date",
                  type: "date",
                  label: "Date",
                },
                {
                  key: "note",
                  type: "string",
                  label: "Note",
                },
              ],
            },
          ],
          actions: [
            {
              operation: "submitUAT",
              mode: "foreground",
              label: "Load Production",
              description: "Send data to UAT environment.",
              primary: true,
            },
            {
              operation: "submitProduction",
              mode: "background",
              label: "Load UAT",
              description: "Send data to Production environment.",
              primary: true,
            },
          ],
        });

        const doc = await api.documents.create(spaceId, {
          title: "Getting Started",
          body:
            "# Welcome\n" +
            "### Say hello to your first customer Space in the new Flatfile!\n" +
            "Let's begin by first getting acquainted with what you're seeing in your Space initially.\n" +
            "---\n",
        });

        await api.jobs.complete(jobId, {
          outcome: {
            message: "Your Space was created. Let's get started.",
            acknowledge: true,
          },
        });
      } catch (error) {
        console.error("Error:", error.stack);

        await api.jobs.fail(jobId, {
          outcome: {
            message: "Creating a Space encountered an error. See Event Logs.",
            acknowledge: true,
          },
        });
      }
    });

  listener
    .filter({ job: "workbook:submitActionFg" })
    .on("job:ready", async (event: FlatfileEvent) => {
      const { workbookId, jobId } = event.context;

      try {
        await api.jobs.ack(jobId, {
          info: "Gettin started.",
          progress: 10,
        });

        //make changes after cells in a Sheet have been updated
        console.log("make changes here when an action is clicked");

        //todo: get the workbook and sheets here
        const sheet2 = "us_sh_8XFdltuj";

        await api.jobs.complete(jobId, {
          outcome: {
            message: "Submit is now complete.",
            next: {
              type: "id",
              id: sheet2,
              label: "Next: Review Sheet 2",
            },
          },
        });
      } catch (error) {
        console.error("Error:", error.stack);

        await api.jobs.fail(jobId, {
          outcome: {
            message: "This job encountered an error.",
          },
        });
      }
    });

}