/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([],
    
    () => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {
                if (scriptContext.type == scriptContext.UserEventType.VIEW) {
                        scriptContext.form.clientScriptModulePath = '../Client/cnt_cs_journal_creation.js';

                        scriptContext.form.addButton({
                                id: 'custpage_update_revenue_plan',
                                label: 'Create Journal Entry',
                                functionName: 'createJournal'
                        });
                }
        }

        return {beforeLoad}

    });
