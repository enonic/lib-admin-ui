export type ValidationResult = {
    readonly message: string;
    readonly custom?: boolean;
    /**
     * Marks an error injected from outside the descriptor pipeline (e.g. a translation
     * failure) so renderers can offer dismiss affordances. Transient entries are cleared
     * automatically on value change and full-value sync by OccurrenceManager.
     */
    readonly transient?: boolean;
};
