# PHQ-9 & GAD-7 Reliability Analysis
# Usage: Rscript phq9_gad7_reliability.R data/phq9_gad7/full_study.csv

suppressPackageStartupMessages({
  library(readr)
  library(dplyr)
  library(psych)
})

args <- commandArgs(trailingOnly = TRUE)
if (length(args) == 0) {
  stop("Please provide the path to the dataset (CSV).", call. = FALSE)
}

data_path <- args[1]

if (!file.exists(data_path)) {
  stop(sprintf("Dataset not found: %s", data_path), call. = FALSE)
}

message("Loading data from ", data_path)
data <- read_csv(data_path, col_types = cols())

# Expected column names
phq_cols <- paste0("phq9_item", 1:9)
gad_cols <- paste0("gad7_item", 1:7)

missing_phq <- setdiff(phq_cols, names(data))
missing_gad <- setdiff(gad_cols, names(data))

if (length(missing_phq) > 0) {
  stop("Missing PHQ-9 columns: ", paste(missing_phq, collapse = ", "))
}
if (length(missing_gad) > 0) {
  stop("Missing GAD-7 columns: ", paste(missing_gad, collapse = ", "))
}

# Reliability
message("\n=== Cronbach's Alpha ===")
phq_alpha <- psych::alpha(data[phq_cols])
gad_alpha <- psych::alpha(data[gad_cols])

print(phq_alpha$total[ , c("raw_alpha", "std.alpha")])
print(gad_alpha$total[ , c("raw_alpha", "std.alpha")])

# Item-total correlations
message("\n=== Item-Total Correlations (PHQ-9) ===")
print(phq_alpha$item.total)

message("\n=== Item-Total Correlations (GAD-7) ===")
print(gad_alpha$item.total)

# KMO and Bartlett tests
message("\n=== Sampling Adequacy ===")
phq_kmo <- KMO(data[phq_cols])
gad_kmo <- KMO(data[gad_cols])

print(list(PHQ9_KMO = phq_kmo$MSA, GAD7_KMO = gad_kmo$MSA))

message("\nBartlett test PHQ-9")
print(cortest.bartlett(cor(data[phq_cols]), n = nrow(data)))

message("\nBartlett test GAD-7")
print(cortest.bartlett(cor(data[gad_cols]), n = nrow(data)))

message("\nAnalysis complete.")

