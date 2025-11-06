# PHQ-9 & GAD-7 Factor Analysis Workflow
# Usage: Rscript phq9_gad7_factor_analysis.R data/phq9_gad7/full_study.csv

suppressPackageStartupMessages({
  library(readr)
  library(dplyr)
  library(psych)
  library(lavaan)
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

phq_cols <- paste0("phq9_item", 1:9)
gad_cols <- paste0("gad7_item", 1:7)

# Check columns
missing <- setdiff(c(phq_cols, gad_cols), names(data))
if (length(missing) > 0) {
  stop("Missing columns: ", paste(missing, collapse = ", "))
}

# Exploratory Factor Analysis (EFA) – PHQ-9
message("\n=== EFA: PHQ-9 ===")
phq_cor <- cor(data[phq_cols], use = "pairwise.complete.obs")
phq_efa <- fa(phq_cor, nfactors = 1, fm = "ml")
print(phq_efa)

# Exploratory Factor Analysis (EFA) – GAD-7
message("\n=== EFA: GAD-7 ===")
gad_cor <- cor(data[gad_cols], use = "pairwise.complete.obs")
gad_efa <- fa(gad_cor, nfactors = 1, fm = "ml")
print(gad_efa)

# Confirmatory Factor Analysis (CFA)
message("\n=== CFA: Two-Factor Model ===")
model_two_factor <- '
  PHQ =~ phq9_item1 + phq9_item2 + phq9_item3 + phq9_item4 + phq9_item5 + phq9_item6 + phq9_item7 + phq9_item8 + phq9_item9
  GAD =~ gad7_item1 + gad7_item2 + gad7_item3 + gad7_item4 + gad7_item5 + gad7_item6 + gad7_item7
  PHQ ~~ GAD
'

cfa_fit <- lavaan::cfa(model_two_factor, data = data, missing = "fiml")
summary(cfa_fit, fit.measures = TRUE, standardized = TRUE)

message("\n=== CFA: Single Factor (Optional) ===")
model_single_factor <- '
  DISTRESS =~ phq9_item1 + phq9_item2 + phq9_item3 + phq9_item4 + phq9_item5 + phq9_item6 + phq9_item7 + phq9_item8 + phq9_item9 +
                 gad7_item1 + gad7_item2 + gad7_item3 + gad7_item4 + gad7_item5 + gad7_item6 + gad7_item7
'

cfa_fit_single <- lavaan::cfa(model_single_factor, data = data, missing = "fiml")
summary(cfa_fit_single, fit.measures = TRUE, standardized = TRUE)

message("\nSave fit indices to CSV")
fit_indices <- data.frame(
  model = c("TwoFactor", "SingleFactor"),
  cfi = c(fitMeasures(cfa_fit)["cfi"], fitMeasures(cfa_fit_single)["cfi"]),
  tli = c(fitMeasures(cfa_fit)["tli"], fitMeasures(cfa_fit_single)["tli"]),
  rmsea = c(fitMeasures(cfa_fit)["rmsea"], fitMeasures(cfa_fit_single)["rmsea"]),
  srmr = c(fitMeasures(cfa_fit)["srmr"], fitMeasures(cfa_fit_single)["srmr"])
)

output_path <- file.path(dirname(data_path), "phq9_gad7_cfa_fit_indices.csv")
readr::write_csv(fit_indices, output_path)
message("Fit indices saved to ", output_path)

message("\nAnalysis complete.")

