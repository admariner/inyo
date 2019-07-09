import styled from '@emotion/styled/macro';
import React from 'react';
import {Link} from 'react-router-dom';

import {formatFullName} from '../../utils/functions';
import {
	accentGrey,
	Button,
	lightPurple,
	primaryBlack,
	primaryGrey,
} from '../../utils/new/design-system';
import MaterialIcon from '../MaterialIcon';

const A = styled(Link)`
	text-decoration: none;
	color: ${primaryGrey};

	&:hover {
		color: ${primaryBlack};
	}
`;

const Container = styled('span')`
	border-radius: 4px;
	padding: 10px;
	font-size: 0.85rem;
	line-height: 1.4;
	transition: all 200ms ease;

	display: grid;
	grid-template-columns: 30px 1fr;

	&:hover {
		background-color: ${lightPurple};
	}
`;

const Notification = ({
	icon, unread, link, children,
}) => {
	const base = (
		<Container unread={unread}>
			<MaterialIcon
				icon={icon}
				size="tiny"
				color={unread ? '' : accentGrey}
			/>
			<div>{children}</div>
		</Container>
	);

	if (link) {
		return <A to={link}>{base}</A>;
	}

	return base;
};

const TextPlusObjectNotification = ({
	from, eventType, object, unread,
}) => {
	let action = 'a effectué';

	let icon = 'notifications';

	let objectLink = '';

	let objectName = '';

	switch (eventType) {
	case 'POSTED_COMMENT':
		action = 'a commenté la tâche';
		icon = 'mode_comment';
		break;
	case 'VIEWED_PROJECT':
		action = 'a consulté le projet';
		icon = 'visibility';
		break;
	case 'UPLOADED_ATTACHMENT':
		action = 'a ajouté un nouveau document sur la tâche';
		icon = 'attachment';
		break;
	case 'FINISHED_TASK':
		action = 'a validé la tâche';
		icon = 'done';
		break;
	case 'ASSIGNED_TASK':
		action = 'vous a assigné à la tâche';
		icon = 'assignment';
		break;
	default:
		action = '';
		icon = 'done';
		break;
	}

	if (object) {
		// eslint-disable-next-line no-underscore-dangle
		switch (object.__typename) {
		case 'Project':
			objectLink = `/app/tasks?projectId=${object.id}`;
			objectName = object.name;
			break;
		case 'Item':
			objectLink = `/app/tasks/${object.id}`;
			objectName = object.name;
			break;
		default:
		}
	}

	return (
		<Notification icon={icon} unread={unread} link={objectLink}>
			{formatFullName(from.title, from.firstName, from.lastName)} {action}{' '}
			{objectName}.
		</Notification>
	);
};

const CollaborationRequestNotification = ({unread, from, object}) => (
	<Notification icon="people" unread={unread}>
		{formatFullName(undefined, from.firstName, from.lastName)} vous a
			invité à collaborer sur le projet {object.name}{' '}
		<Button link>Accepter</Button>{' '}
		<Button link red>
				Refuser
		</Button>
	</Notification>
);

const NotificationItem = (props) => {
	let notification;

	switch (props.eventType) {
	case 'POSTED_COMMENT':
	case 'VIEWED_PROJECT':
	case 'UPLOADED_ATTACHMENT':
	case 'FINISHED_TASK':
	case 'ASSIGNED_TASK':
		notification = <TextPlusObjectNotification {...props} />;
		break;
	case 'COLLAB_REQUEST':
		notification = <CollaborationRequestNotification {...props} />;
		break;
	default:
		notification = false;
	}

	return notification;
};

export default NotificationItem;
