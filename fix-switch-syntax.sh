#!/bin/bash

# Script to fix switch statement syntax errors in TypeScript files
# Removes unnecessary opening braces after case statements

echo "Fixing switch statement syntax errors..."

# List of files to fix based on the build errors
FILES=(
  "src/components/Integration/RetroactiveIntegrationTool.tsx"
  "src/components/Interventions/InterventionHistory.tsx"
  "src/components/Lots/CompleteLots.tsx"
  "src/components/Lots/PenMap.tsx"
  "src/components/Lots/PenMapIntegrated.tsx"
  "src/components/Lots/PenOccupancyIndicators.tsx"
  "src/components/Modals/StatusChangeModal.tsx"
  "src/components/Registrations/CompleteRegistrations.tsx"
  "src/components/Reports/ModernDREStatementViewer.tsx"
  "src/components/Sales/SalesManagement.tsx"
  "src/components/ui/collaboration-indicators.tsx"
  "src/services/lotIntegrationService.ts"
  "src/stores/useAppStore.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."

    # Create a backup
    cp "$file" "$file.bak"

    # Fix pattern: case 'something':\n{ -> case 'something':
    # This removes the opening brace on the line after case statements
    perl -i -pe 's/^(\s*case\s+[^:]+:)\s*\n\s*\{/$1/g' "$file"

    # For multi-line fixes, use a more complex perl script
    perl -i -0pe 's/case\s+([^:]+):\s*\n\s*\{\s*\n(\s*return[^;]+;)/case $1:\n$2/gs' "$file"

    echo "Fixed $file"
  else
    echo "File not found: $file"
  fi
done

echo "All files processed!"