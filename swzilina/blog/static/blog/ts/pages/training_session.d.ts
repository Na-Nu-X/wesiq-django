import type { ChartType } from "chart.js";
type CustomCanvasBackgroundColorOptions = {
    color?: string;
};
declare module "chart.js" {
    interface PluginOptionsByType<TType extends ChartType> {
        customCanvasBackgroundColor?: CustomCanvasBackgroundColorOptions;
    }
}
export {};
//# sourceMappingURL=training_session.d.ts.map