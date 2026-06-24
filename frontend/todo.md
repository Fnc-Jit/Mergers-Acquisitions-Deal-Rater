# M&A Deal Rater - Project TODO

## Database & Schema
- [x] Create deals table schema in drizzle/schema.ts
- [x] Create historical_deals table for comparable deals
- [x] Generate and apply migrations via webdev_execute_sql

## Landing Page (/)
- [x] Build hero section with "M&A Deal Rater" headline and CTA button
- [x] Build methodology trust strip with 3 cards (SEC filings, SHAP explainability, Stratified cross-validation)
- [x] Build footer with GitHub link and "Built by Jitraj Esh" credit
- [x] Ensure white theme and clean typography

## Deal Scoring Form (/score)
- [x] Create DealInputForm component with fields:
  - [x] Acquirer ticker (text input)
  - [x] Target ticker (text input)
  - [x] Deal value USD (numeric input)
  - [x] Premium % (numeric input)
  - [x] Payment type (radio: Cash/Stock/Mixed)
  - [x] Cross-border toggle
  - [x] Same-industry toggle
- [x] Add form validation and error handling
- [ ] Create tRPC procedure to handle deal scoring

## Score Output Display
- [x] Build ScoreGauge component with 0-100 dial
- [x] Implement color grading (red <40, amber 40-70, green >70)
- [x] Create ShapWaterfall component for feature attribution visualization
- [x] Integrate mock/simulated SHAP data with realistic attributions

## Historical Comparables Table
- [x] Build HistoricalDealsTable component with columns:
  - [x] Deal name
  - [x] Value
  - [x] Premium
  - [x] Payment type
  - [x] Actual outcome
- [x] Implement logic to find 5 most similar historical deals
- [x] Display below SHAP waterfall

## Analytics Dashboard
- [x] Build Deal Volume by Sector bar chart (Recharts)
- [x] Build Score Distribution histogram (Recharts)
- [x] Build Premium vs Success Rate scatter chart (Recharts)
- [x] Ensure white/clean styling for all charts

## Navigation & Layout
- [ ] Set up DashboardLayout with sidebar navigation
- [ ] Create navigation links: Dashboard, Score a Deal, Historical Deals
- [ ] Update App.tsx routing to include all pages
- [ ] Ensure responsive design across all breakpoints

## Styling & Theme
- [ ] Configure white theme in client/src/index.css
- [ ] Apply consistent spacing, shadows, and typography
- [ ] Ensure all components follow design tokens
- [ ] Test responsive design on mobile/tablet/desktop

## Testing
- [ ] Write vitest tests for tRPC procedures
- [ ] Write vitest tests for form validation
- [ ] Write vitest tests for score calculation logic

## Final Delivery
- [ ] Review all pages for consistency and polish
- [ ] Create checkpoint before publishing
- [ ] Deliver project to user
