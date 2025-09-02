interface ValidationHelperProps {
  isRequired: boolean;
  hasValue: boolean;
  hasError: boolean;
}

export function ValidationHelper({ 
  isRequired, 
  hasValue, 
  hasError
}: ValidationHelperProps) {
  // Only show "Required" text for required fields that are empty
  if (isRequired && !hasValue && !hasError) {
    return (
      <div className="mt-1 text-sm text-red-600">
        Required
      </div>
    );
  }

  return null;
}
