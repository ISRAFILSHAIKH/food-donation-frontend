// Format a date string into a readable form
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

// Check if a donation has expired
export const isExpired = (expiryTime) => {
  return new Date(expiryTime) < new Date();
};

// Map status string → badge CSS class
export const statusClass = (status) => {
  const map = {
    pending:   'badge-pending',
    approved:  'badge-approved',
    rejected:  'badge-rejected',
    accepted:  'badge-accepted',
    picked_up: 'badge-picked_up',
    delivered: 'badge-delivered',
  };
  return map[status] || 'badge-pending';
};

// Capitalise first letter and replace underscores
export const prettyStatus = (status) =>
  status ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';