/**
 * Duning Manual Email Sent
 * by Cinntra Infotech Pvt. Ltd.
 * rishabh.gaur@cinntra.com
 *
 * @NScriptName Dunning Manual Email sent
 * @NScriptType MapReduceScript
 * @NApiVersion 2.1
 */
define(["N/format", "N/log", "N/record", "N/runtime", "N/search", "N/email","N/render","N/file","N/url"], function (format, log, record, runtime, search, email,render,file,url) {
    var exports = {};
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.summarize = exports.map = exports.getInputData = void 0;
  
    var getInputData = () => {
        log.audit('getInputData()', 'Script Starting...');
     
        try { 
           var customrecord_dunning_email_statusSearchObj = search.create({
               type: "customrecord_dunning_email_status",
               filters: [
                  ["custrecord_transaction_id","noneof","@NONE@"], 
                  "AND", 
                  ["custrecord_to_email","isnotempty",""], 
                  "AND", 
                  ["custrecord_email_send_successfully","is","F"],
                  "AND", 
                  ["custrecord_email_failed_reason","isempty",""], 
                  "AND", 
                  ["custrecord_days_overdue_email","isnotempty",""]
               ],
               columns: [
                  search.createColumn({name: "custrecord_transaction_id", label: "Transaction Id"}),
                  search.createColumn({name: "custrecord_to_email", label: "To Email"}),
                  search.createColumn({name: "custrecord_cc_email", label: "CC Email"}),
                  search.createColumn({name: "custrecord_days_overdue_email", label: "DaysOverDue"}),
                  search.createColumn({name: "internalid", label: "Internal ID"})
               ]
           });
           var searchResultCount = customrecord_dunning_email_statusSearchObj.runPaged().count;
           log.debug("customrecord_dunning_email_statusSearchObj result count",searchResultCount);
        }
        catch (e) {
            log.error('getInputData', e.message);
        }
        return customrecord_dunning_email_statusSearchObj;
    };
    exports.getInputData = getInputData;

    var map = (mapContext) => {
        log.debug('mapContext.value', mapContext.value);
       
        try {
            const invoiceObj = JSON.parse(mapContext.value);
            log.debug('invoiceObj', invoiceObj);
            let tranId = invoiceObj.values.custrecord_transaction_id.value;
            log.debug('tranId', tranId);
			let tranIdName = invoiceObj.values.custrecord_transaction_id.text;
            log.debug('tranIdName', tranIdName);
            let toEmail = invoiceObj.values.custrecord_to_email;
            log.debug('toEmail', toEmail);
            let ccEmail = invoiceObj.values.custrecord_cc_email;
            log.debug('ccEmail', ccEmail);
            let daysDue = invoiceObj.values.custrecord_days_overdue_email;
            log.debug('daysDue', daysDue);
            var recType = invoiceObj.recordType;
            log.debug('recType', recType);
            var recId = invoiceObj.id;
            log.debug('recId', recId);

            var attach = [];
            var xmlTmplFile = file.load('Templates/PDF Templates/archer_invoice_template.xml');
            log.debug('xmlTmplFile', xmlTmplFile);
            var myFile = render.create();
            myFile.templateContent = xmlTmplFile.getContents();
            log.debug('myFile', myFile);
            myFile.addRecord('record', record.load({
                type: "invoice",
                id: tranId
            }));
            var invoicePdf = myFile.renderAsPdf();
            log.debug('invoicePdf', invoicePdf);
            var fileName =  tranIdName + '.pdf'
            var filePDF = file.create({
                name: fileName,
                fileType: file.Type.PDF,
                contents: invoicePdf.getContents(),
                folder: 5413,
                isOnline: true
            });
            log.debug('filePDF', filePDF);
            var fileId = filePDF.save();
            log.debug('fileId', fileId);
            var loadingPdfFile = file.load({
                id: fileId
            });
            attach.push(loadingPdfFile);
            log.debug('loadingPdfFile', loadingPdfFile);
            if (toEmail) {
                var emailSubject;
                var emailBody;
                var customrecord_dunning_procedure_recordSearchObj = search.create({
                    type: "customrecord_dunning_procedure_record",
                    filters: [
                        ["custrecord_days_overdue", "equalto", daysDue]
                    ],
                    columns: [
                        search.createColumn({name: "custrecord_procedure_name", label: "Procedure Name"}),
                        search.createColumn({name: "custrecord_days_overdue", label: "Days OverDue"}),
                        search.createColumn({name: "custrecord_email_template_duning", label: "Email Template"}),
                        search.createColumn({name: "custrecord_email_subject_duning", label: "Email Subject"}),
                        search.createColumn({name: "custrecord_email_body_dunning", label: "Email Body"})
                    ]
                });

                var searchResultCount = customrecord_dunning_procedure_recordSearchObj.runPaged().count;
                log.debug("customrecord_dunning_procedure_recordSearchObj result count", searchResultCount);
                customrecord_dunning_procedure_recordSearchObj.run().each(function(result){
                    emailSubject = result.getValue({
                        name: "custrecord_email_subject_duning"
                    });
								emailSubject = emailSubject.replace("INVXXXXXX",tranIdName);

                    emailBody = result.getValue({
                        name: "custrecord_email_body_dunning"
                    });
                    return true;
                });

                var authorId = 233739;
				var arrCCemail = []
				arrCCemail.push(ccEmail)
 const individualEmails = arrCCemail.flatMap(arrCCemail => {
    // Check if the element is a string before splitting
    if (typeof arrCCemail === 'string') {
        return arrCCemail.split(',');
    } else {
        // Handle case where element is not a string (e.g., it might be an object or another type)
        log.error('Element is not a string:', arrCCemail);
        // Return an empty array or handle it according to your logic
        return [];
    }
});
var getLength = individualEmails.length;

           if(getLength>1){
         
                    var ccEmailId = email.send({
                        author: authorId,
                        recipients: toEmail,
                        bcc: ['AR@archersystem.com'],
                        cc: individualEmails,
                        subject: emailSubject,
                        body: emailBody,
                        attachments: attach
                    });
                    log.debug('ccEmailId', ccEmailId);
                } else {
                    var emailId = email.send({
                        author: authorId,
                        recipients: toEmail,
                        bcc: ['AR@archersystem.com'],
                        subject: emailSubject,
                        body: emailBody,
                        attachments: attach
                    });
                    log.debug('emailId', emailId);
                }

                var msgId;                    
                var messageSearchObj = search.create({
                    type: "message",
                    filters: [
                        ["subject", "is", emailSubject], 
                        "AND", 
                        ["author.internalid", "anyof", authorId], 
                        "AND", 
                        ["attachments.name", "contains", fileName]
                    ],
                    columns: [
                        search.createColumn({
                            name: "internalid",
                            summary: "MAX",
                            label: "Internal ID"
                        })
                    ]
                });
                var searchResultCount = messageSearchObj.runPaged().count;
                log.debug("messageSearchObj result count", searchResultCount);
                messageSearchObj.run().each(function(result){
                    msgId = result.getValue({
                        name: "internalid",
                        summary: "MAX"
                    });
                    return true;
                });
                var output = url.resolveRecord({
                    recordType: 'message',
                    recordId: msgId,
                    isEditMode: false
                });
                log.debug('output', output);
                var makingLink = "https://7261626-sb1.app.netsuite.com" + output;
                
                var emailsend = record.submitFields({
                    type: recType,
                    id: recId,
                    values: {
                        'custrecord_email_send_successfully': true
                    }
                });
                log.debug('emailsend', emailsend);

                let duningLogs = record.create({
                    type: 'customrecord_dunning_email_logs_2'
                });
                duningLogs.setValue({
                    fieldId: 'custrecord_email_linkup_2',
                    value: tranId
                });
                log.debug('daysDue check', daysDue);
                duningLogs.setValue({
                    fieldId: 'custrecord_email_copy',
                    value: makingLink
                });

                if (daysDue == 16) {
                    duningLogs.setValue({
                        fieldId: 'custrecord6',
                        value: 4
                    });
                }
                if (daysDue == 30) {
                    duningLogs.setValue({
                        fieldId: 'custrecord6',
                        value: 5
                    });
                }
                if (daysDue == 60) {
                    duningLogs.setValue({
                        fieldId: 'custrecord6',
                        value: 6
                    });
                }
                if (daysDue == 90) {
                    duningLogs.setValue({
                        fieldId: 'custrecord6',
                        value: 7
                    });
                }

                duningLogs.setValue({
                    fieldId: 'custrecord_email_status',
                    value: 1
                });

                var duningRec = duningLogs.save();
                log.debug('duningRec', duningRec);
            }
        } catch (e) {
            log.error('map', e.message);

            var failedReason = record.submitFields({
                type: recType,
                id: recId,
                values: {
                    'custrecord_email_failed_reason': e.message
                }
            });
            log.debug('failedReason', failedReason);

            let duningLogs = record.create({
                type: 'customrecord_dunning_email_logs_2'
            });
            duningLogs.setValue({
                fieldId: 'custrecord_email_linkup_2',
                value: tranId
            });
            if (daysDue == 16) {
                duningLogs.setValue({
                    fieldId: 'custrecord6',
                    value: 4
                });
            }
            if (daysDue == 30) {
                duningLogs.setValue({
                    fieldId: 'custrecord6',
                    value: 5
                });
            }
            if (daysDue == 60) {
                duningLogs.setValue({
                    fieldId: 'custrecord6',
                    value: 6
                });
            }
            if (daysDue == 90) {
                duningLogs.setValue({
                    fieldId: 'custrecord6',
                    value: 7
                });
            }
            duningLogs.setValue({
                fieldId: 'custrecord_fail_reason',
                value: e.message
            });
            duningLogs.setValue({
                fieldId: 'custrecord_email_status',
                value: 1
            });

            var duningRec = duningLogs.save();
            log.debug('duningRec', duningRec);
        }
    };
    exports.map = map;

    var summarize = (context) => {
        try { 
            
        } catch (e) {
            log.error('summarize()', e.message);
        }
        log.audit('summarize()', 'Execution Complete');
    };
    exports.summarize = summarize;
    return exports;
});