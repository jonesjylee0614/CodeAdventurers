declare global {
  namespace JSX {
    interface Element {
      type: any;
      props: any;
      key: any;
    }
    
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    
    interface ElementAttributesProperty {
      props: {};
    }
    
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

declare module 'react' {
  interface DragEvent<T = Element> extends MouseEvent<T> {
    dataTransfer: DataTransfer;
    preventDefault(): void;
    stopPropagation(): void;
  }
  
  interface MouseEvent<T = Element> {
    clientX: number;
    clientY: number;
    preventDefault(): void;
    stopPropagation(): void;
  }

  interface FC<P = {}> {
    (props: P): JSX.Element | null;
  }
  
  function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
  function useRef<T>(initialValue: T | null): { current: T | null };
  
  namespace React {
    interface DragEvent<T = Element> extends MouseEvent<T> {
      dataTransfer: DataTransfer;
      preventDefault(): void;
      stopPropagation(): void;
    }
    
    interface MouseEvent<T = Element> {
      clientX: number;
      clientY: number;
      preventDefault(): void;
      stopPropagation(): void;
    }

    interface FC<P = {}> {
      (props: P): JSX.Element | null;
    }
    
    function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
    function useEffect(effect: () => void | (() => void), deps?: any[]): void;
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    function useRef<T>(initialValue: T | null): { current: T | null };
  }
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any, key?: any): JSX.Element;
  export function jsxs(type: any, props: any, key?: any): JSX.Element;
}

export {};
