export const TRANSFORM_PRESETS = [
  {
    label: 'Filter',
    code: '// Filter items by condition\nreturn _.filter(data, item => item.age > 25)',
  },
  {
    label: 'Map',
    code: '// Transform each item\nreturn _.map(data, item => ({\n  ...item,\n  name: item.name.toUpperCase()\n}))',
  },
  {
    label: 'Pick keys',
    code: "// Keep only specific keys\nreturn _.map(data, item => _.pick(item, ['name', 'id']))",
  },
  {
    label: 'Omit keys',
    code: "// Remove specific keys\nreturn _.map(data, item => _.omit(item, ['bio', 'version']))",
  },
  { label: 'Sort by', code: "// Sort by a key\nreturn _.sortBy(data, 'name')" },
  {
    label: 'Group by',
    code: "// Group items by a key\nreturn _.groupBy(data, 'language')",
  },
  {
    label: 'Unique by',
    code: "// Get unique items by a key\nreturn _.uniqBy(data, 'language')",
  },
  {
    label: 'Flatten',
    code: '// Flatten nested arrays\nreturn _.flatMap(data, item => item.tags || item)',
  },
  {
    label: 'Count by',
    code: "// Count occurrences by key\nreturn _.countBy(data, 'language')",
  },
  { label: 'First N', code: '// Take first N items\nreturn _.take(data, 5)' },
  {
    label: 'Pluck',
    code: "// Extract a single field\nreturn _.map(data, 'name')",
  },
  {
    label: 'Key by',
    code: "// Index items by a key\nreturn _.keyBy(data, 'id')",
  },
];
