/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(['N/ui/serverWidget','N/search','N/query','N/task','N/record'], function(serverWidget,search,query,task,record) {
// const emailStatus ={'Sent':2,'Not Sent':}
    function onRequest(context) {
		if(context.request.method == 'GET'){
        var form = serverWidget.createForm({
            title: 'Dunning Email Sending Queue'
        });
    form.clientScriptModulePath = 'SuiteScripts/CS_Duning_Que_screen.js';
	
	var customerNameParam = context.request.parameters.custpage_customer;
	var customerSubsidiary = context.request.parameters.custpage_subsidiary;
	var procedure = context.request.parameters.custpage_dunning_procedure;
    var daysOverdue = context.request.parameters.daysoverdue;
	//var emailFilter1 = context.request.parameters.custpage_emailfilterstatus;


      var filterGroup = form.addFieldGroup({
            id: 'filter_group',
            label: 'Filter'
        });	
        form.addField({
            id: 'custpage_customer',
            type: serverWidget.FieldType.SELECT,
            label: 'customer',
			source : 'Customer',
			container: 'filter_group'
        });
        form.addField({
            id: 'custpage_subsidiary',
            type: serverWidget.FieldType.SELECT,
            label: 'Subsidiary',
			source : 'subsidiary',
			container: 'filter_group'
        });
        form.addField({
            id: 'custpage_dunning_procedure',
            type: serverWidget.FieldType.SELECT,
            label: 'Dunning Procedure',
           source : 'customrecord_dunning_procedure_record',
			container: 'filter_group'
        });
	
	        form.addSubmitButton({
			label: 'Send Email'
		});
      
			var sublist = form.addSublist({
			id: 'custpage_sublist',
			type: serverWidget.SublistType.LIST,
			label: 'Current Queue'
		});
		form.addButton({
			id: 'custpage_filter_button',
			label: 'Filter',
			functionName : 'filterButtonClick'
		});

		sublist.addMarkAllButtons();

		 var checkBox = sublist.addField({
			id: 'custpage_checkbox',
			type: serverWidget.FieldType.CHECKBOX,
			label: 'Mark'
		});
		var emailstatusFLd = sublist.addField({
			id: 'custpage_emailstatus',
			type: serverWidget.FieldType.SELECT,
			label: 'Email Status'
		});
		emailstatusFLd.addSelectOption({
			text : 'Not Send',
			value : '2'
		});
		emailstatusFLd.addSelectOption({
			text : 'Send',
			value : '1'
		});
		emailstatusFLd.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
		sublist.addField({
			id: 'custpage_inv_date',
			type: serverWidget.FieldType.DATE,
			label: 'DATE'
		});	
		var invoiceFLd = sublist.addField({
			id: 'custpage_record',
			type: serverWidget.FieldType.SELECT,
			label: 'Invoice',
			source : 'invoice'
		});
    invoiceFLd.updateDisplayType({displayType: serverWidget.FieldDisplayType.HIDDEN});
	var invoicedoc = sublist.addField({
			id: 'custpage_record_name',
			type: serverWidget.FieldType.TEXT,
			label: 'Invoice'
		});

		var customerFld = sublist.addField({
			id: 'custpage_customer',
			type: serverWidget.FieldType.SELECT,
			label: 'Customer',
			source : 'customer'
		});
		customerFld.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
      var subFLd = sublist.addField({
            id: 'custpage_subsidiary_sub',
            type: serverWidget.FieldType.SELECT,
            label: 'Subsidiary',
			source : 'subsidiary',
 });
    subFLd.updateDisplayType({displayType: serverWidget.FieldDisplayType.INLINE});
		sublist.addField({
			id: 'custpage_daysoverdue',
			type: serverWidget.FieldType.TEXT,
			label: 'DaysOverDue'
		});
			var emailTo = sublist.addField({
			id: 'custpage_emailto',
			type: serverWidget.FieldType.TEXT,
			label: 'To-Email'
		});
		log.debug ('emailTo',emailTo);
		emailTo.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
		var emailCC = sublist.addField({
			id: 'custpage_emailcc',
			type: serverWidget.FieldType.TEXT,
			label: 'CC-Email'
		});
		emailCC.updateDisplayType({displayType: serverWidget.FieldDisplayType.ENTRY});
		sublist.addField({
			id: 'custpage_emailbcc',
			type: serverWidget.FieldType.TEXT,
			label: 'BCC-Email'
		});	
            sublist.addField({
			id: 'custpage_customer_attention',
			type: serverWidget.FieldType.TEXT,
			label: 'Customer Attention'
		});	
		var filter = [];
	  filter.push(["amountremainingisabovezero","is","T"])
      filter.push("AND")
      filter.push(["customermain.custentity_pause_duninng","is","F"])
	  filter.push("AND"),
	  filter.push(["custbody_pause_dunning_invoice","is","F"])
      filter.push("AND")
      filter.push (["status","noneof","CustInvc:V","CustInvc:E","CustInvc:D","CustInvc:B"])
      filter.push("AND")
      filter.push(["mainline","is","T"])
      filter.push("AND")
      filter.push(["type","anyof","CustInvc"])
	  if(customerNameParam){
		filter.push("AND")
		filter.push(["customermain.internalid","anyof",customerNameParam])
		filter.push("AND"),
		filter.push([["daysoverdue","equalto","16"],"OR",["daysoverdue","equalto","30"],"OR",["daysoverdue","equalto","60"],"OR",["daysoverdue","equalto","90"]]),
		filter.push("AND"),
		filter.push(["custbody_pause_dunning_invoice","is","F"])
	  }
	  if(customerSubsidiary){
		filter.push("AND")
		filter.push(["subsidiary","anyof",customerSubsidiary])
		filter.push("AND")
		filter.push([["daysoverdue","equalto","16"],"OR",["daysoverdue","equalto","30"],"OR",["daysoverdue","equalto","60"],"OR",["daysoverdue","equalto","90"]])

	  }
	  
	   if(daysOverdue){
		filter.push("AND")
		filter.push(["daysoverdue","equalto",daysOverdue])
	  }
	  
	  if(!customerNameParam && !daysOverdue){
		filter.push("AND")
	  	filter.push([[["amountremainingisabovezero","is","T"],"AND",["customermain.custentity_pause_duninng","is","F"],"AND",["custbody_pause_dunning_invoice","is","F"],"AND",["status","noneof","CustInvc:V","CustInvc:E","CustInvc:D","CustInvc:B"],"AND",["mainline","is","T"],"AND",["type","anyof","CustInvc"]],"AND",[["daysoverdue","equalto","16"],"OR",["daysoverdue","equalto","30"],"OR",["daysoverdue","equalto","60"],"OR",["daysoverdue","equalto","90"]]])
	  }
	  
   var transactionSearchObj = search.create({
   type: "transaction",
   settings:[{"name":"consolidationtype","value":"ACCTTYPE"}],
   filters:filter,
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
		 name: "internalid",
         summary: "GROUP",
         label: "Internal ID"
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
         name: "email",
         summary: "GROUP",
         label: "Email"
      }),
	  search.createColumn({
         name: "custentity_duning_to_be_emailed",
         join: "customerMain",
		 summary: "GROUP",
         label: "To-Be Emailed "
      }),
      search.createColumn({
         name: "custentity_dunning_email_cc",
         join: "customerMain",
		  summary: "GROUP",
         label: "cc"
      }),
	  search.createColumn({
		name: "custrecord_email_status",
		join: "CUSTRECORD_EMAIL_LINKUP_2",
		summary: "GROUP",
		label: "Email status"
	 }),
	  
      search.createColumn({
         name: "entity",
         summary: "GROUP",
         label: "Name"
      }),
      search.createColumn({
         name: "shipattention",
         join: "customerMain",
         summary: "GROUP",
         label: "Shipping Attention"
      })
   ]
  });
	  var custID ;
	  var daysOverdueFilter ;
	  var subsidiary ; 
	  var customerStatus ;
	  var customerName ;
	  var invdate ;
	  var custEmail ; 
	  var emailStatus;
	  var ccEmail;
	  var custAttention;
  
		var searchResultCount = transactionSearchObj.runPaged().count;
		log.debug("transactionSearchObj result count",searchResultCount);
		if(searchResultCount>0){
		var count = 0;
		transactionSearchObj.run().each(function(result){
     
			 custID = result.getValue({
				 name: "internalid",
                 summary: "GROUP"
			});
			custID = result.getText({
				 name: "internalid",
                 summary: "GROUP"
			});
			 daysOverdueFilter = result.getValue({
				name: "daysoverdue",
                summary: "GROUP"
			});
		
			 subsidiary = result.getValue({
				name: "subsidiary",
                summary: "GROUP"
			});
			 customerStatus = result.getValue({
              name: "statusref",
			  summary: "GROUP"
		   	});
			 customerName = result.getValue({
				 name: "entity",
               summary: "GROUP"
			});
			 invdate = result.getValue({
				 name: "trandate",
                summary: "GROUP"
			});
			 custEmail = result.getValue({
			 name: "custentity_duning_to_be_emailed",
			 join: "customerMain",
			  summary: "GROUP"
				 });
			
	       custAttention = result.getValue({
			 name: "shipattention",
			 join: "customerMain",
			  summary: "GROUP",
			 label: "Shipping Attention"
          });
		  
			ccEmail =  result.getValue({
			 name: "custentity_dunning_email_cc",
			 join: "customerMain",
			   summary: "GROUP"
		    });
			 emailStatus =result.getValue({
				name: "custrecord_email_status",
				join: "CUSTRECORD_EMAIL_LINKUP_2",
				summary: "GROUP"
			 })
			 var docNumber = result.getValue({
				 name: "tranid",
                summary: "GROUP"
			 })
		
			if(custID){
			sublist.setSublistValue({
				id : 'custpage_record',
				line :count,
				value : custID
			});
			}
			if(customerName){
			sublist.setSublistValue({
				id : 'custpage_customer',
				line :count,
				value : customerName
			})
			}
				if (custEmail) {
            sublist.setSublistValue({ 
			id: 'custpage_emailto',
			line: count, 
			value: custEmail 
			});
           }
		    if(ccEmail){
				sublist.setSublistValue({
				id : 'custpage_emailcc',
				line :count,
				value : ccEmail
			});
				
			}
			if(daysOverdueFilter){
			 sublist.setSublistValue({
				id : 'custpage_daysoverdue',
				line :count,
				value : daysOverdueFilter
			});
			}
			sublist.setSublistValue({
				id : 'custpage_inv_date',
				line :count,
				value : invdate
			});
			sublist.setSublistValue({
				id : 'custpage_subsidiary_sub',
				line :count,
				value : subsidiary
			});
			sublist.setSublistValue({
				id : 'custpage_customer_attention',
				line :count,
				value : custAttention
			});
			sublist.setSublistValue({
				id : 'custpage_record_name',
				line :count,
				value : docNumber
			});
			
			sublist.setSublistValue({
				id : 'custpage_emailbcc',
				line :count,
				value : 'ar@archersystem.com'
			});
			if(emailStatus){
				sublist.setSublistValue({
					id : 'custpage_emailstatus',
					line :count,
					value : emailStatus
				});
			}else{
				sublist.setSublistValue({
					id : 'custpage_emailstatus',
					line :count,
					value : '2'
				});
			}
			count++
   return true;
  });
		}

	context.response.writePage(form);
	}
		
	if(context.request.method == 'POST'){
		try{
		var sublistCount = context.request.getLineCount({
        group: 'custpage_sublist'
	  });
	log.debug('sublistCount',sublistCount);
		for(var count = 0; count<sublistCount; count++){
		var checkboxResult = context.request.getSublistValue({
		group: 'custpage_sublist',
		name: 'custpage_checkbox',
		line: count
	});
	log.debug('checkboxResult',checkboxResult);
	if(checkboxResult == 'T' || checkboxResult == true  ){
		var tranId = context.request.getSublistValue({
		group: 'custpage_sublist',
		name: 'custpage_record',
		line: count
	});
	log.debug('tranId',tranId);
		var dayOver = context.request.getSublistValue({
		group: 'custpage_sublist',
		name: 'custpage_daysoverdue',
		line: count
	});
		var toEmail = context.request.getSublistValue({
		group: 'custpage_sublist',
		name: 'custpage_emailto',
		line: count
	});
		var ccEmail = context.request.getSublistValue({
		group: 'custpage_sublist',
		name: 'custpage_emailcc',
		line: count
	});
	var emailStatusRec = record.create({
		type : 'customrecord_dunning_email_status'
	});
	if(toEmail != '-None-'){
	emailStatusRec.setValue({
		fieldId : 'custrecord_to_email',
		value : toEmail
	});
	}
		if(ccEmail != '-None-'){
	emailStatusRec.setValue({
		fieldId : 'custrecord_cc_email',
		value : ccEmail
	});
		}
	emailStatusRec.setValue({
		fieldId : 'custrecord_days_overdue_email',
		value : dayOver
	});
	emailStatusRec.setValue({
		fieldId : 'custrecord_transaction_id',
		value : tranId
	});
	var emailStatusRecId = emailStatusRec.save();
   log.debug('emailStatusRecId',emailStatusRecId);
	
}
	}
	if(emailStatusRecId){
	var scriptTask = task.create({
      taskType: task.TaskType.MAP_REDUCE
      });
		 scriptTask.scriptId = 'customscript_mr_dunning_email_send';
		 scriptTask.deploymentId = 'customdeploy_mr_dunning_email';
	   var scriptTaskId = scriptTask.submit();
		context.response.write('Execution Executed Successfully!')
	}
		}
	
   catch(ex){
	context.response.write(ex.message)
}  	
	}
	}	
		return {
			onRequest: onRequest
		};
	});