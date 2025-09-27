import type { InputHTMLAttributes } from 'react';
import './input.css';

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <input className="ui-input" {...props} />
);
