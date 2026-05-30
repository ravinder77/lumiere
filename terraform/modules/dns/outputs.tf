output "zone_id" {
  description = "Route53 hosted zone ID."
  value       = local.zone_id
}

output "zone_arn" {
  description = "Route53 hosted zone ARN."
  value       = local.zone_id == null ? null : "arn:aws:route53:::hostedzone/${local.zone_id}"
}

output "zone_name" {
  description = "Route53 hosted zone name."
  value       = local.zone_name
}

output "name_servers" {
  description = "Name servers for the public hosted zone when this module creates it."
  value       = try(aws_route53_zone.this[0].name_servers, null)
}

output "record_fqdns" {
  description = "FQDNs of records managed by this module."
  value       = { for key, record in aws_route53_record.this : key => record.fqdn }
}
