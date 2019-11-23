import { JupyterFrontEndPlugin, JupyterFrontEnd, ILayoutRestorer } from "@jupyterlab/application";
import { IWidgetTracker, WidgetTracker } from "@jupyterlab/apputils";
import { IRegistry } from "@jupyterlab/dataregistry-extension";
import { IDocumentWidget } from "@jupyterlab/docregistry";
import { Token } from "@phosphor/coreutils";
import { SpreadsheetModelFactory, JupyterSpreadsheetModel } from "./modelfactory";
import { SpreadsheetWidget } from "./widget";
import { SpreadsheetWidgetFactory } from "./widgetfactory";
import { registerConverters, XLSX_MIMETYPE, XLS_MIMETYPE } from "./registry";

export const ISpreadsheetTracker = new Token("jupyterlab-spreadsheet:tracker");
export type ISpreadsheetTracker = IWidgetTracker<
    IDocumentWidget<SpreadsheetWidget, JupyterSpreadsheetModel>
>;

function activateSpreadsheet(
    app: JupyterFrontEnd,
    restorer: ILayoutRestorer,
    registry?: IRegistry,
): ISpreadsheetTracker {
    const { docRegistry } = app;
    const tracker = new WidgetTracker<
        IDocumentWidget<SpreadsheetWidget, JupyterSpreadsheetModel>
    >({
        namespace: "jupyterlab-spreadsheet"
    });
    const factory = new SpreadsheetWidgetFactory({
        name: "Spreadsheet",
        modelName: "workbook",
        fileTypes: [
            "excel",
            "csv",
            "dsv"
        ],
        defaultFor: [
            "excel",
        ],
    });
    const modelFactory = new SpreadsheetModelFactory();
    docRegistry.addModelFactory(modelFactory);
    docRegistry.addWidgetFactory(factory);
    docRegistry.addFileType({
        name: "excel",
        displayName: "Excel Workbook",
        fileFormat: "base64",
        extensions: [
            ".xls",
            ".xlsx"
        ],
        mimeTypes: [
            XLS_MIMETYPE,
            XLSX_MIMETYPE,
            "application/octet-stream",
            "text/plain"
        ]
    });
    
    if (registry) {
        registerConverters(registry)
    }

    factory.widgetCreated.connect((sender, widget) => {
        tracker.add(widget);
        widget.context.pathChanged.connect(() => {
            tracker.save(widget);
        });
    });
    restorer.restore(tracker, {
        command: "docmanager:open",
        args: widget => ({path: widget.context.path, factory: "Spreadsheet"}),
        name: widget => widget.context.path
    });
    return tracker;
}

const plugin: JupyterFrontEndPlugin<ISpreadsheetTracker> = {
    id: "jupyter-spreadsheet",
    autoStart: true,
    requires: [ILayoutRestorer],
    optional: [IRegistry],
    provides: ISpreadsheetTracker,
    activate: activateSpreadsheet
};

export default plugin;
