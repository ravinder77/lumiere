# ---- Elastic IPs ------ (one per AZ for HA)
resource "aws_eip" "nat" {
  count = length(var.availability_zones)
  domain = "vpc"
  tags = merge(var.tags, {
    Name = "${var.name_prefix}-eip-${count.index + 1}"
  })
}


# --- Nat Gateway -----
resource "aws_nat_gateway" "main" {
  count = length(var.availability_zones)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id = aws_subnet.public[count.index].id

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-nat-${var.availability_zones[count.index]}"
  })

  depends_on = [aws_internet_gateway.main]
}
