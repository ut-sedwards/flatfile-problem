import api from "@flatfile/api";
import { FlatfileListener, FlatfileEvent, Client } from "@flatfile/listener";
import { recordHook, FlatfileRecord } from "@flatfile/plugin-record-hook";

export default function (listener: Client) {
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
                  key: "noteDate",
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
