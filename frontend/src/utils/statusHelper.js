export const getPriorityStyles = (priority) => {
  switch (priority) {
    case 'Urgent':
      return {
        bg: 'bg-red-500/20',
        text: 'text-red-400',
        border: 'border-red-500/30',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
        pulse: 'animate-pulse'
      };
    case 'High':
      return {
        bg: 'bg-purple-500/20',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        glow: 'shadow-[0_0_15px_rgba(168,85,247,0.2)]',
        pulse: ''
      };
    case 'Medium':
      return {
        bg: 'bg-green-500/20',
        text: 'text-green-400',
        border: 'border-green-500/30',
        glow: 'shadow-[0_0_15px_rgba(34,197,94,0.2)]',
        pulse: ''
      };
    default:
      return {
        bg: 'bg-white/5',
        text: 'text-white/40',
        border: 'border-white/10',
        glow: '',
        pulse: ''
      };
  }
};

export const getTimeToBreach = (deadline) => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  if (diff < 0) return 'BREACHED';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${mins}m`;
};

export const getStatusColor = (status, type) => {
  switch (status) {
    case 'Completed': return 'text-green-500';
    case 'Rejected': return 'text-red-500';
    case 'Pending Review': return 'text-yellow-500';
    case 'Accepted': return type === 'IT' ? 'text-it-cyan' : 'text-eng-orange';
    case 'Assigned': return type === 'IT' ? 'text-it-cyan' : 'text-eng-orange';
    case 'Disputed': return 'text-red-500 animate-pulse';
    default: return 'text-white/40';
  }
};
