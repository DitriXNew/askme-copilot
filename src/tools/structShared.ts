export { applyStructuredWorkspaceEdit, buildXPath, IJsonQueryMatch, IMutationSummary, IResolvedFile, IXmlQueryMatch, schemaTypeLabel } from './struct/common';
export { analyzeJsonLikeDiagnostics } from './struct/diagnostics';
export {
    detectJsonFlavor,
    detectStructuredFormat,
    parseJsonDocument,
    parseJsonDocumentWithFlavor,
    parseXmlDocument,
    resolveAndReadStructuredFile
} from './struct/file';
export { stringifyJson, stringifyJsonForEdit, stringifyXml, stringifyXmlForEdit } from './struct/formatting';
export {
    inspectStructuredDocument,
    queryJson,
    queryStructuredDocument,
    queryXml
} from './struct/inspectQuery';
export { mutateStructuredDocument } from './struct/mutate';
export { diffStructuredDocuments, validateStructuredDocument } from './struct/validateDiff';
export {
    createDiffUsage,
    createInspectUsage,
    createMutateUsage,
    createQueryUsage,
    createValidateUsage,
    summarizeMutationResult
} from './struct/usage';