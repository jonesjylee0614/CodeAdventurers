import type { SelectHTMLAttributes } from 'react';
import './select.css';

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select className="ui-select" {...props} />
);
