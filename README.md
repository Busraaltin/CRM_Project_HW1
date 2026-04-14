# HW1 CRM Project - Lead Capture Workflow

This repository contains the deliverables for the lead capture workflow homework assignment.

## Architecture Overview

The workflow follows a strict 4-stage architecture:

1. **HTTP Webhook Trigger**: The entry point for the pipeline. It listens for incoming HTTP POST requests containing lead details (`name`, `email`, `company`, `message`).
2. **Data Mapping (Processing Function)**: A code execution block (`mapping_function.js`) that takes the raw webhook payload and maps it into a standardized schema, handling validation and default values.
3. **Google Sheets Integration**: An external API action node that receives the formatted data and appends it as a new row in a designated Google Sheets document.
4. **AI Summarization & Scoring**: The final node runs an AI action over the mapped `message` to produce a concise summary of the prospect's needs and assigns an interest rating (**Low**, **Medium**, or **High**) to help prioritize follow-up.

## Files Included

- `mapping_function.js`: The JavaScript logic for the Step 2 mapping phase.
- `workflow_export.json`: The JSON structure of the entire workflow mapping out the nodes and edges.
- `README.md`: This documentation and testing guide.

---

## Testing with Postman

You can use the following JSON payload to test the webhook trigger node via Postman (or `curl`).

1. Set the request method to **POST**.
2. Set the URL to your workflow's Webhook Trigger endpoint.
3. In the **Headers** tab, add `Content-Type: application/json`.
4. In the **Body** tab, select **raw** and paste the JSON below:

```json
{
  "name": "Alex Mercer",
  "email": "alex.mercer@example.com",
  "company": "TechNova Solutions",
  "message": "We are looking to upgrade our enterprise CRM system next month and wanted to see if your software integrates with our current ERP. We have a budget of $50k and need a solution urgently."
}
```

### Expected Execution Flow
1. **Node 1** receives the payload.
2. **Node 2** (`mapping_function.js`) maps the structure (e.g., changes `company` to `organization`, adds `captured_at` timestamp).
3. **Node 3** appends Alex's details to the configured spreadsheet.
4. **Node 4** processes the message, creating a summary (e.g., *"Looking to upgrade CRM urgently with a $50k budget; requires ERP integration."*) and outputs a rating of **High**.
