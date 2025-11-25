declare module 'driver.js' {
  export interface DriverOptions {
    className?: string;
    animate?: boolean;
    opacity?: number;
    padding?: number;
    allowClose?: boolean;
    overlayClickNext?: boolean;
    doneBtnText?: string;
    closeBtnText?: string;
    nextBtnText?: string;
    prevBtnText?: string;
    showProgress?: boolean;
    steps?: StepDefinition[];
    onHighlightStarted?: (element: Element) => void;
    onHighlighted?: (element: Element) => void;
    onDeselected?: (element: Element) => void;
    onReset?: (element: Element) => void;
    onNext?: (element: Element) => void;
    onPrevious?: (element: Element) => void;
  }

  export interface StepDefinition {
    element: Element | string;
    stage?: number;
    popover?: {
      className?: string;
      title?: string;
      description?: string;
      showButtons?: boolean;
      doneBtnText?: string;
      closeBtnText?: string;
      nextBtnText?: string;
      prevBtnText?: string;
    };
    onHighlightStarted?: (element: Element) => void;
    onHighlighted?: (element: Element) => void;
    onDeselected?: (element: Element) => void;
  }

  export default class Driver {
    constructor(options?: DriverOptions);
    defineSteps(steps: StepDefinition[]): void;
    start(step?: number): void;
    next(): void;
    previous(): void;
    reset(): void;
    hasNextStep(): boolean;
    hasPreviousStep(): boolean;
    refresh(): void;
  }

  export function driver(options?: DriverOptions): Driver;
}
