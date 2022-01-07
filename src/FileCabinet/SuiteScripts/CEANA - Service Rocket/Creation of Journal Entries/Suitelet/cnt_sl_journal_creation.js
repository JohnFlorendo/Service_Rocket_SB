/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/record', 'N/url'],
    /**
     * @param{record} record
     * @param{url} url
     */
    (record, url) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            try {
                if (scriptContext.request.method === 'GET') {
                    log.debug('Start');
                }
            } catch (e) {
                log.debug('error', e);
            }
            // log.debug('Start');
            // var recJournalEntry = record.create({
            //     type: record.Type.JOURNAL_ENTRY,
            //     isDynamic: true
            // });
            //
            // log.debug('recJournalEntry', recJournalEntry);
            // recJournalEntry.setValue({
            //     fieldId: 'subsidiary',
            //     value: 8
            // });
            // log.debug('End');
        }

        return {onRequest}

    });
