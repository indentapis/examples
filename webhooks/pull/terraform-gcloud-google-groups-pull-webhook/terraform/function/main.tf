locals {
  svc_account = length(google_service_account.runtime_account) == 0 ? var.service_account_email : google_service_account.runtime_account[0].email
}

// Compress function code into archive
data "archive_file" "zipped_source" {
  source_dir  = "${var.root_dir}${var.source_dir}"
  output_path = "${var.root_dir}/dist/${var.name}.zip"
  type        = "zip"
}

// Upload function archive to bucket
resource "google_storage_bucket_object" "uploaded_source" {
  name   = "${var.name}/${data.archive_file.zipped_source.output_base64sha256}.zip"
  source = data.archive_file.zipped_source.output_path
  bucket = var.bucket
}

// Create service account for function (if one isn't provided)
resource "google_service_account" "runtime_account" {
  count = var.service_account_email == "" ? 1 : 0

  account_id   = var.name
  display_name = "Function runtime account for ${var.name}"
  description  = "Provides the runtime service account identity for ${var.name}"
}

// Deploy HTTP function
resource "google_cloudfunctions_function" "deploy" {

  name        = var.name
  description = coalesce(var.description, "${var.name} served using HTTP")
  region      = var.region
  runtime     = var.runtime

  available_memory_mb   = var.memory
  source_archive_bucket = var.bucket
  source_archive_object = google_storage_bucket_object.uploaded_source.name
  trigger_http          = true
  service_account_email = local.svc_account

  timeout     = var.timeout
  entry_point = var.entry_point
  environment_variables = merge(
    var.environment_variables,
    {
      GCP_SVC_ACCT_EMAIL = local.svc_account
    }
  )
}

// Allow public access to function
resource "google_cloudfunctions_function_iam_member" "invoker" {

  project        = google_cloudfunctions_function.deploy[0].project
  region         = google_cloudfunctions_function.deploy[0].region
  cloud_function = google_cloudfunctions_function.deploy[0].name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}
