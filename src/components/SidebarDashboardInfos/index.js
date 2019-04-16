import React from 'react';
import styled from '@emotion/styled';
import {useQuery} from 'react-apollo-hooks';

import TaskRemindersList from '../TaskRemindersList';
import noRemindersIllus from '../../utils/images/bermuda-done.svg';

import {
	Aside,
	SubHeading,
	primaryGrey,
	lightGrey,
} from '../../utils/new/design-system';
import {Loading} from '../../utils/content';
import {BREAKPOINTS} from '../../utils/constants';
import {GET_REMINDERS} from '../../utils/queries';

const DashboardAside = styled(Aside)`
	padding-right: 0;
	padding-left: 4rem;
	max-width: 320px;
	flex: 0 0 320px;
	display: flex;

	@media (max-width: ${BREAKPOINTS}px) {
		padding-left: 0;
	}

	img {
		align-self: center;
		max-width: 40%;
		margin: 1rem 30%;
	}
`;

const SubSection = styled('div')`
	margin-bottom: 2rem;
	margin-top: 1rem;
	position: relative;

	@media (max-width: ${BREAKPOINTS}px) {
		margin-bottom: 1rem;
	}

	&:before {
		content: '';
		display: block;
		background: ${lightGrey};
		position: absolute;
		left: -1rem;
		top: -1rem;
		right: -1rem;
		bottom: -1rem;
		border-radius: 8px;
		z-index: -1;
	}
`;

const SidebarHeading = styled(SubHeading)`
	display: flex;
	justify-content: space-between;
	margin-bottom: 10px;
`;

const NoReminders = styled('div')`
	font-style: italic;
	color: ${primaryGrey};
`;

const SidebarDashboardInfos = () => {
	const {data, loading} = useQuery(GET_REMINDERS, {suspend: false});

	const reminders
		= data.reminders
		&& data.reminders.filter(reminder => reminder.status === 'PENDING');

	return (
		<DashboardAside>
			<SubSection>
				<SidebarHeading>Actions d'edwige</SidebarHeading>
				{loading && <Loading />}
				{!loading
					&& (reminders.length > 0 ? (
						<TaskRemindersList
							small
							reminders={reminders}
							baseUrl="/app/dashboard"
						/>
					) : (
						<NoReminders>
							<img src={noRemindersIllus} />
							Aucune tâches client n’ont été activées pour le
							moment
						</NoReminders>
					))}
			</SubSection>
		</DashboardAside>
	);
};

export default SidebarDashboardInfos;