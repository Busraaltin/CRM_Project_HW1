/**
 * Processes incoming webhook data and maps it to a standard lead format.
 *
 * Expected incoming fields: name, email, company, message
 */
function processLeadData(inputData) {
  // Validate input
  if (!inputData || !inputData.email) {
    throw new Error("Invalid input: email is required.");
  }

  // Extract raw fields
  const { name, email, company, message } = inputData;

  // Map to standardized structure for downstream systems
  const mappedData = {
    contact_name: name || "Unknown",
    contact_email: email,
    organization: company || "N/A",
    inquiry_message: message || "",
    captured_at: inputData.date || new Date().toISOString(),
    lead_status: "New"
  };

  return mappedData;
}

module.exports = { processLeadData };
