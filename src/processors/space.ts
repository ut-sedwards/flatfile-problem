import api from "@flatfile/api";

export async function configure(context) {
  const { spaceId, environmentId, jobId } = context;
  try {
    await api.jobs.ack(jobId, {
      info: "Preparing Space",
      progress: 10,
    });

    await api.workbooks.create({
      spaceId,
      environmentId,
      name: "Membership Import Data",
      sheets: [
        {
          name: "Organizations",
          slug: "organizations",
          access: ["add", "edit", "delete", "import"],
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
                  },
                ],
              },
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
          access: ["add", "edit", "delete", "import"],
          fields: [
            {
              key: "identifier",
              type: "string",
              label: "ID",
              constraints: [{ type: "required" }, { type: "unique" }],
            },
            {
              key: "orgID",
              type: "reference",
              label: "Organization ID",
              constraints: [{ type: "required" }],
              config: {
                ref: "organizations",
                key: "orgId",
                relationship: "has-one",
              },
            },
            {
              key: "firstName",
              type: "string",
              label: "First Name",
              constraints: [{ type: "required" }],
            },
            {
              key: "lastName",
              type: "string",
              label: "Last Name",
              constraints: [{ type: "required" }],
            },
            {
              key: "email",
              type: "string",
              label: "Email",
              constraints: [{ type: "unique" }],
            },
          ],
        },
        {
          name: "Notes",
          slug: "notes",
          access: ["add", "edit", "delete", "import"],
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
          primary: false,
        },
      ],
    });

    await api.documents.create(spaceId, {
      title: "Getting Started",
      body:
        "# Welcome\n" +
        "### Say hello to your first customer Space in the new Flatfile!\n" +
        "Let's begin by first getting acquainted with what you're seeing in your Space initially.\n" +
        "---\n",
    });
    await api.documents.create(spaceId, {
      title: "Member Data",
      body:
        "# Member Data\n" +
        "### Say hello to my little friend!\n" +
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
}

export async function theme(spaceId, environmentId) {
  await api.spaces.update(spaceId, {
    environmentId,
    metadata: {
      theme: {
        sidebar: {
          logo: "https://res.cloudinary.com/drbktebzm/image/upload/v1691610416/NugetImages/uniontrack-64x64_xqr1jx.png",
        },
      },
    },
  });
}
