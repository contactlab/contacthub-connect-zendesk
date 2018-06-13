# Contacthub Zendesk widget ###

## Requirements

- npm >= 5.X
- Node >= 8.X

## Installation

- Clone the repository.
- Run the shell command "npm install" from the project root folder.
- Make a copy of the ".env.sample" file and rename it ".env".
- Configure the ".env" file.
- Run the node application.
- Optionally configure the reverse proxy on your http server (recommended).
- On the Zendesk Admin panel, go to the "SETTINGS > Extensions" page.
- Add an "HTTP target" target and configure it as follows:  
   **Title**: Anything is fine.  
   **Url**: *SERVER_URL*/zdtt, where *SERVER_URL* is your Contacthub-Zendesk server URL (together with the port if needed).  
   **Method**: POST  
   **Content type**: JSON  
   **Basic Authentication**: Enable and configure it if needed.
- On the Zendesk Admin panel, go to the "BUSINESS RULES > Triggers" page.
- Add a new trigger and configure it as follows:  
   **Trigger name**: Anything is fine.  
   **Description**: As above.  
   **Conditions**: Insert all required conditions. At least 2 conditions are needed as **ANY conditions**:  
   - "Ticket is Created".  
   - "Ticket is Updated".  
   
   **Actions**: Select "Notify target" as the action, together with the "HTTP target" name previously set as a target. Insert the following code as JSON body:  
  
   ```javascript
   {
	"requester": {
		"name": "{{ticket.requester.name}}",
		"first_name": "{{ticket.requester.first_name}}",
		"last_name": "{{ticket.requester.last_name}}",
		"email": "{{ticket.requester.email}}",
		"language": "{{ticket.requester.language}}",
		"phone": "{{ticket.requester.phone}}",
		"external_id": "{{ticket.requester.external_id}}",
		"details": "{{ticket.requester.details}}",
		"notes": "{{ticket.requester.notes}}",
		"time_zone": "{{ticket.requester.time_zone}}",
		"role": "{{ticket.requester.role}}",
		"extended_role": "{{ticket.requester.extended_role}}",
		"id": "{{ticket.requester.id}}",
		"locale": "{{ticket.requester.locale}}",
		"signature": "{{ticket.requester.signature}}",
		"organization": {
			"id": "{{ticket.requester.organization.id}}",
			"name": "{{ticket.requester.organization.name}}",
			"is_shared": "{{ticket.requester.organization.is_shared}}",
			"is_shared_comments": "{{ticket.requester.organization.is_shared_comments}}",
			"details": "{{ticket.requester.organization.details}}",
			"notes": "{{ticket.requester.organization.notes}}",
			"tags": "{{ticket.requester.organization.tags}}"
		},
		"tags": "{{ticket.requester.tags}}"
	},
	"assignee": {
		"name": "{{ticket.assignee.name}}",
		"first_name": "{{ticket.assignee.first_name}}",
		"last_name": "{{ticket.assignee.last_name}}",
		"email": "{{ticket.assignee.email}}",
		"language": "{{ticket.assignee.language}}",
		"phone": "{{ticket.assignee.phone}}",
		"external_id": "{{ticket.assignee.external_id}}",
		"details": "{{ticket.assignee.details}}",
		"notes": "{{ticket.assignee.notes}}",
		"time_zone": "{{ticket.assignee.time_zone}}",
		"role": "{{ticket.assignee.role}}",
		"extended_role": "{{ticket.assignee.extended_role}}",
		"id": "{{ticket.assignee.id}}",
		"locale": "{{ticket.assignee.locale}}",
		"signature": "{{ticket.assignee.signature}}",
		"organization": {
			"id": "{{ticket.assignee.organization.id}}",
			"name": "{{ticket.assignee.organization.name}}",
			"is_shared": "{{ticket.assignee.organization.is_shared}}",
			"is_shared_comments": "{{ticket.assignee.organization.is_shared_comments}}",
			"details": "{{ticket.assignee.organization.details}}",
			"notes": "{{ticket.assignee.organization.notes}}",
			"tags": "{{ticket.assignee.organization.tags}}"
		},
		"tags": "{{ticket.assignee.tags}}"
	},
	"submitter": {
		"name": "{{ticket.submitter.name}}",
		"first_name": "{{ticket.submitter.first_name}}",
		"last_name": "{{ticket.submitter.last_name}}",
		"email": "{{ticket.submitter.email}}",
		"language": "{{ticket.submitter.language}}",
		"phone": "{{ticket.submitter.phone}}",
		"external_id": "{{ticket.submitter.external_id}}",
		"details": "{{ticket.submitter.details}}",
		"notes": "{{ticket.submitter.notes}}",
		"time_zone": "{{ticket.submitter.time_zone}}",
		"role": "{{ticket.submitter.role}}",
		"extended_role": "{{ticket.submitter.extended_role}}",
		"id": "{{ticket.submitter.id}}",
		"locale": "{{ticket.submitter.locale}}",
		"signature": "{{ticket.submitter.signature}}",
		"organization": {
			"id": "{{ticket.submitter.organization.id}}",
			"name": "{{ticket.submitter.organization.name}}",
			"is_shared": "{{ticket.submitter.organization.is_shared}}",
			"is_shared_comments": "{{ticket.submitter.organization.is_shared_comments}}",
			"details": "{{ticket.submitter.organization.details}}",
			"notes": "{{ticket.submitter.organization.notes}}",
			"tags": "{{ticket.submitter.organization.tags}}"
		},
		"tags": "{{ticket.submitter.tags}}"
	},
	"current_user": {
		"name": "{{current_user.name}}",
		"first_name": "{{current_user.first_name}}",
		"last_name": "{{current_user.last_name}}",
		"email": "{{current_user.email}}",
		"language": "{{current_user.language}}",
		"phone": "{{current_user.phone}}",
		"external_id": "{{current_user.external_id}}",
		"details": "{{current_user.details}}",
		"notes": "{{current_user.notes}}",
		"time_zone": "{{current_user.time_zone}}",
		"role": "{{current_user.role}}",
		"extended_role": "{{current_user.extended_role}}",
		"id": "{{current_user.id}}",
		"locale": "{{current_user.locale}}",
		"signature": "{{current_user.signature}}",
		"organization": {
			"id": "{{current_user.organization.id}}",
			"name": "{{current_user.organization.name}}",
			"is_shared": "{{current_user.organization.is_shared}}",
			"is_shared_comments": "{{current_user.organization.is_shared_comments}}",
			"details": "{{current_user.organization.details}}",
			"notes": "{{current_user.organization.notes}}",
			"tags": "{{current_user.organization.tags}}"
		},
		"tags": "{{current_user.tags}}"
	},
	"agent": {
		"name": "{{agent.name}}",
		"first_name": "{{agent.first_name}}",
		"last_name": "{{agent.last_name}}",
		"email": "{{agent.email}}",
		"language": "{{agent.language}}",
		"phone": "{{agent.phone}}",
		"external_id": "{{agent.external_id}}",
		"details": "{{agent.details}}",
		"notes": "{{agent.notes}}",
		"time_zone": "{{agent.time_zone}}",
		"role": "{{agent.role}}",
		"extended_role": "{{agent.extended_role}}",
		"id": "{{agent.id}}",
		"locale": "{{agent.locale}}",
		"signature": "{{agent.signature}}",
		"organization": {
			"id": "{{agent.organization.id}}",
			"name": "{{agent.organization.name}}",
			"is_shared": "{{agent.organization.is_shared}}",
			"is_shared_comments": "{{agent.organization.is_shared_comments}}",
			"details": "{{agent.organization.details}}",
			"notes": "{{agent.organization.notes}}",
			"tags": "{{agent.organization.tags}}"
		},
		"tags" : "{{agent.tags}}"
	},
	"ticket": {
		"account": "{{ticket.account}}",
		"assignee_name": "{{ticket.assignee.name}}",
		"brand_name": "{{ticket.brand.name}}",
		"cc_names": "{{ticket.cc_names}}",
		"created_at": "{{ticket.created_at}}",
		"created_at_with_timestamp": "{{ticket.created_at_with_timestamp}}",
		"created_at_with_time": "{{ticket.created_at_with_time}}",
		"current_holiday_name": "{{ticket.current_holiday_name}}",
		"description": "{{ticket.description}}",
		"due_date": "{{ticket.due_date}}",
		"due_date_with_timestamp": "{{ticket.due_date_with_timestamp}}",
		"external_id": "{{ticket.external_id}}",
		"encoded_id": "{{ticket.encoded_id}}",
		"group_name": "{{ticket.group.name}}",
		"GROUPID": "{{ticket.group.id}}",
		"id": "{{ticket.id}}",
		"link": "{{ticket.link}}",
		"in_business_hours": "{{ticket.in_business_hours}}",
		"organization_external_id": "{{ticket.organization.external_id}}",
		"organization_name": "{{ticket.organization.name}}",
		"priority": "{{ticket.priority}}",
		"requester_name2": "{{ticket.requester.name}}",
		"status": "{{ticket.status}}",
		"tags": "{{ticket.tags}}",
		"ticket_form": "{{ticket.ticket_form}}",
		"ticket_type": "{{ticket.ticket_type}}",
		"title": "{{ticket.title}}",
		"updated_at": "{{ticket.updated_at}}",
		"updated_at_with_time": "{{ticket.updated_at_with_time}}",
		"updated_at_with_timestamp": "{{ticket.updated_at_with_timestamp}}",
		"via": "{{ticket.via}}",
		"account_incoming_phone_number_ID": "{{account.incoming_phone_number_ID}}"
	},
	"comments": {
		"comments": "{{ticket.comments}}",
		"public_comments": "{{ticket.public_comments}}",
		"latest_comment": "{{ticket.latest_comment}}",
		"latest_public_comment": "{{ticket.latest_public_comment}}",
		"comments_formatted": "{{ticket.comments_formatted}}",
		"public_comments_formatted": "{{ticket.public_comments_formatted}}",
		"latest_comment_formatted": "{{ticket.latest_comment_formatted}}",
		"latest_public_comment_formatted": "{{ticket.latest_public_comment_formatted}}"
	},
	"satisfaction": {
		"rating_section": "{{satisfaction.rating_section}}",
		"rating_url": "{{satisfaction.rating_url}}",
		"current_rating": "{{satisfaction.current_rating}}",
		"positive_rating_url": "{{satisfaction.positive_rating_url}}",
		"negative_rating_url": "{{satisfaction.negative_rating_url}}",
		"current_comment": "{{satisfaction.current_comment}}"
	}
   }
   ```

- On the Zendesk Admin panel, go to the "APPS > Manage" page.  
- Click the "Upload private app" button.  
- In the "App Name" field, insert a name that identifies our widget (for example, "Contacthub widget").  
- Click the "Choose File" button and select the widget archive file downloaded from this project [release section](https://github.com/contactlab/contacthub-connect-zendesk/releases).  
- Click the "Upload" button to install the widget (You have to confirm the non-Zendesk widget installation).  
- After the installation process, you have to configure the widget (you can change these settings at any time):  
   **Title**: Should be auto-set by the system.  
   **JWT shared secret**: Insert the same shared secret that you set in the server .env file.  
   **App server URL**: Insert the API server URL.  
   **App server domain for whitelisting**: Insert the API server domain, without the schema and/or path.  
- Click the "Install" button to terminate the installation.  
- Now, when a ticket is created or modified, the customer and the ticket info are saved on the Contacthub platform.  
- Now you are able to see the widget installed in the app column, in the ticket detail page and in the customer detail page.  

