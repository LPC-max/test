import React from 'react';

const stageConfig = {
  'Nouveau':             { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400'   },
  'Présélection':        { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  'Entretien RH':        { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  'Entretien Technique': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  'Offre':               { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Embauché':            { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500'  },
  'Refusé':              { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
};

export default function StageTag({ stage, size = 'sm' }) {
  const config = stageConfig[stage] || stageConfig['Nouveau'];
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${padding}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {stage}
    </span>
  );
}
