/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(['N/search', 'N/email', 'N/runtime', 'N/record', 'N/file', 'N/render', 'N/url'], function (search, email, runtime, record, file, render, url) {

    function getInputData() {
        var invoiceSearchObj = search.create({
	   type: "invoice",
	   settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
	   filters:
	   [
		  ["amountremainingisabovezero","is","T"], 
		  "AND", 
		  ["customermain.custentity_pause_duninng","is","F"],
		  "AND", 
		  ["status","noneof","CustInvc:V","CustInvc:E","CustInvc:D","CustInvc:B"], 
		  "AND", 
		  ["mainline","is","T"], 
		  "AND", 
		  ["type","anyof","CustInvc"],
		  "AND", 
		  [["daysoverdue","equalto","60"],"OR",["daysoverdue","equalto","16"],"OR",["daysoverdue","equalto","30"],"OR",["daysoverdue","equalto","90"]],
		  "AND", 
		  ["custbody_pause_dunning_invoice","is","F"]
	   ],
	   columns:
	   [
      search.createColumn({
         name: "trandate",
         summary: "GROUP",
         label: "Date"
      }),
      search.createColumn({
         name: "entity",
         summary: "GROUP",
         label: "Name"
      }),
      search.createColumn({
         name: "tranid",
         summary: "GROUP",
         label: "Document Number"
      }),
      search.createColumn({
         name: "amount",
         summary: "SUM",
         label: "Amount"
      }),
      search.createColumn({
         name: "daysoverdue",
         summary: "GROUP",
         label: "Days Overdue"
      }),
      search.createColumn({
         name: "statusref",
         summary: "GROUP",
         label: "Status"
      }),
      search.createColumn({
         name: "tranid",
         summary: "GROUP",
         label: "Document Number"
      }),
      search.createColumn({
         name: "subsidiary",
         summary: "GROUP",
         label: "Subsidiary"
      }),
      search.createColumn({
         name: "internalid",
         summary: "GROUP",
         label: "Internal ID"
      }),
      search.createColumn({
         name: "email",
         summary: "GROUP",
         label: "Email"
      }),
      search.createColumn({
         name: "custrecord_email_status",
         join: "CUSTRECORD_EMAIL_LINKUP_2",
         summary: "GROUP",
         label: "Email status"
      })
   ]
	});
	
	var searchResultCount = invoiceSearchObj.runPaged().count;
	log.debug("invoiceSearchObj result count",searchResultCount);
	invoiceSearchObj.run().each(function(result){
	   return true;
	});
		return invoiceSearchObj;
    }

    function map(context) {
      var searchResult = JSON.parse(context.value);
      log.debug('searchResult', searchResult);
      var emailAddr = searchResult.values['GROUP(email)'];
	log.debug('emailAddr', emailAddr);
	if (emailAddr !== '- None -' && emailAddr.trim() !== "") {
    var daysOverdue = searchResult.values['GROUP(daysoverdue)'];
    log.debug('daysOverdue', daysOverdue);
    var invoiceId = searchResult.values['GROUP(internalid)'].value;
    log.debug('invoiceId', invoiceId);

    context.write({
        key: invoiceId,
        value: {
            email: emailAddr,
            daysOverdue: daysOverdue
        }
    });
}

    }

    function reduce(context) {
        var invoiceId = context.key;
        log.debug('invoiceId', invoiceId);
        var data = JSON.parse(context.values[0]);
        log.debug('data', data);
        var emailAddr = data.email;
		log.debug ('emailAddr',emailAddr);
        var daysOverdue = data.daysOverdue;
        log.debug('daysOverdue', daysOverdue);

        try {
            // Get email template details
	

            // Create PDF attachment
            var invoiceRecord = record.load({ type: "invoice", id: invoiceId });
            var xmlTmplFile = file.load('Templates/PDF Templates/archer_invoice_template.xml');
			log.debug ('xmlTmplFile',xmlTmplFile);
            var renderer = render.create();
            renderer.templateContent = xmlTmplFile.getContents();
            renderer.addRecord('record', invoiceRecord);
            var invoicePdf = renderer.renderAsPdf();
            var fileName = invoiceId + '.pdf';
			log.debug ('fileName',fileName);
            var filePDF = file.create({
                name: fileName,
                fileType: file.Type.PDF,
                contents: invoicePdf.getContents(),
                folder: 5413,
                isOnline: true
            });
			log.debug ('filePDF',filePDF);
            var fileId = filePDF.save();
            log.debug('fileId',fileId);
            var emailAttachments = [];
            emailAttachments.push(file.load({ id: fileId }));
			log.debug('emailAttachments',emailAttachments);
			if (emailAddr){
            var emailSubject, emailBody;
            var emailTemplateSearch = search.create({
				type : 'customrecord_dunning_procedure_record',
                filters: ["custrecord_days_overdue", "equalto", daysOverdue],
                columns: [
                   search.createColumn({name: "custrecord_procedure_name", label: "Procedure Name"}),
                        search.createColumn({name: "custrecord_days_overdue", label: "Days OverDue"}),
                        search.createColumn({name: "custrecord_email_template_duning", label: "Email Template"}),
                        search.createColumn({name: "custrecord_email_subject_duning", label: "Email Subject"}),
                        search.createColumn({name: "custrecord_email_body_dunning", label: "Email Body"})
                ]
            });
            emailTemplateSearch.run().each(function (result) {
                emailSubject = result.getValue("custrecord_email_subject_duning");
                emailBody = result.getValue("custrecord_email_body_dunning");
                return true;
            });
			var authorId = 233739;
			
			//Send Email
			
         var sendEmail = email.send({
                author: 233739,
                recipients: emailAddr,
				bcc: ['AR@archersystem.com'],
                subject: emailSubject,
                body: emailBody,
                attachments: emailAttachments
            });
			
              log.debug('sendEmail',sendEmail);
            // Update email status
               record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceId,
                values: { custrecord_email_status: 'Sent' }
            });
			
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
			
			 let duningLogs = record.create({
                    type: 'customrecord_dunning_email_logs_2'
                });
				log.debug ('duningLogs',duningLogs);
                duningLogs.setValue({
                    fieldId: 'custrecord_email_linkup_2',
                    value: invoiceId
                });
                log.debug('daysDue check');
                duningLogs.setValue({
                    fieldId: 'custrecord_email_copy',
                    value: makingLink
                });
           
                if (daysOverdue == 16) {
                    duningLogs.setValue({
                        fieldId: 'custrecord6',
                        value: 4
                    });
                }
                if (daysOverdue == 30) {
                    duningLogs.setValue({
                        fieldId: 'custrecord6',
                        value: 5
                    });
                }
                if (daysOverdue == 60) {
                    duningLogs.setValue({
                        fieldId: 'custrecord6',
                        value: 6
                    });
                }
                if (daysOverdue == 90) {
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
		   
		}
		catch (e) {
            log.error('reduce', e.message);

            record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceId,
                values: { custrecord_email_failed_reason: e.message }
            });
        }
    }

    function summarize(summary) {
        var totalEmailsSent = 0;

        summary.mapSummary.errors.iterator().each(function (key, error) {
            log.error('Map Error for Key: ' + key, error);
            return true;
        });

        summary.reduceSummary.errors.iterator().each(function (key, error) {
            log.error('Reduce Error for Key: ' + key, error);
            return true;
        });

        summary.output.iterator().each(function (key, value) {
            totalEmailsSent++;
            return true;
        });

        log.audit('Total Emails Sent', totalEmailsSent);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
