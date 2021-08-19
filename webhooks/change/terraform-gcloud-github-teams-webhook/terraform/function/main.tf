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

  timeout     = var.timeout
  entry_point = var.entry_point
  environment_variables = merge(
    var.environment_variables,
  )
}

// Allow public access to function
resource "google_cloudfunctions_function_iam_member" "invoker" {
  project        = google_cloudfunctions_function.deploy.project
  region         = google_cloudfunctions_function.deploy.region
  cloud_function = google_cloudfunctions_function.deploy.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}
