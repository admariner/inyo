import React, {useContext} from 'react';
import {withRouter} from 'react-router-dom';
import styled from '@emotion/styled';
import {useQuery} from 'react-apollo-hooks';
import moment from 'moment';
import ReactTooltip from 'react-tooltip';

import Plural from '../Plural';
import IssuerNameAndAddress from '../IssuerNameAndAddress';

import {
	SubHeading,
	primaryGrey,
	P,
	primaryPurple,
	primaryBlack,
} from '../../utils/new/design-system';
import {ReactComponent as TasksIcon} from '../../utils/icons/tasks-icon.svg';
import {ReactComponent as SharedNotesIcon} from '../../utils/icons/shared-notes-icon.svg';
import {ReactComponent as PersonalNotesIcon} from '../../utils/icons/personal-notes-icon.svg';
import {GET_PROJECT_INFOS} from '../../utils/queries';
import {TOOLTIP_DELAY, BREAKPOINTS} from '../../utils/constants';
import {CustomerContext} from '../../utils/contexts';

const Aside = styled('aside')`
	display: flex;
	flex-direction: column;
	align-items: stretch;
	width: 270px;
	padding-right: 4rem;

	@media (max-width: ${BREAKPOINTS}px) {
		margin-top: 2rem;
		padding-right: 0;
		width: 100%;
	}
`;

const SubSection = styled('div')`
	margin-bottom: 2rem;
`;

const BigNumber = styled(P)`
	font-size: 20px;
	font-weight: 500;
	color: ${primaryGrey};
`;

const DateContainer = styled('div')`
	position: relative;
`;

const SidebarLink = styled('div')`
	display: flex;
	align-items: center;
	color: ${props => (props.active ? primaryBlack : primaryPurple)};
	text-decoration: none;
	font-weight: 500;
	margin-bottom: 8px;
	cursor: ${props => (props.active ? 'default' : 'pointer')};
`;

const SidebarHeading = styled(SubHeading)`
	display: flex;
	justify-content: space-between;
	margin-bottom: 10px;
`;

const ProjectMenuIcon = styled('div')`
	margin-right: 10px;
`;

const SidebarCustomerProjectInfos = ({projectId, location, history}) => {
	const query = new URLSearchParams(location.search);
	const activeView = query.get('view');

	const customerToken = useContext(CustomerContext);

	const {data, error} = useQuery(GET_PROJECT_INFOS, {
		variables: {projectId, token: customerToken},
	});

	if (error) throw error;

	const {project} = data;

	function setView(view) {
		const query = new URLSearchParams(location.search);

		query.delete('filter');
		query.set('view', view);
		history.push(`/app/${customerToken}/tasks/?${query.toString()}`);
	}

	return (
		<Aside>
			<ReactTooltip effect="solid" delayShow={TOOLTIP_DELAY} />

			<SubSection>
				<SidebarHeading>Menu Projet</SidebarHeading>
				<SidebarLink
					onClick={() => setView('tasks')}
					active={activeView === 'tasks' || !activeView}
				>
					<ProjectMenuIcon>
						<TasksIcon />
					</ProjectMenuIcon>
					Tâches du projet
				</SidebarLink>
				<SidebarLink
					onClick={() => setView('shared-notes')}
					active={activeView === 'shared-notes'}
				>
					<ProjectMenuIcon>
						<SharedNotesIcon />
					</ProjectMenuIcon>
					Notes partagées
				</SidebarLink>
			</SubSection>
			<SubSection>
				<SidebarHeading>Votre prestataire</SidebarHeading>
				<IssuerNameAndAddress issuer={project.issuer} />
			</SubSection>

			<SubSection>
				<SidebarHeading>Deadline</SidebarHeading>
				<DateContainer>
					<BigNumber data-tip="Date limite du projet">
						{(project.deadline
							&& moment(project.deadline).format('DD/MM/YYYY')) || (
							<>&mdash;</>
						)}
					</BigNumber>
				</DateContainer>
			</SubSection>

			{project.daysUntilDeadline !== null && (
				<SubSection>
					<SubHeading>Marge jours restants</SubHeading>
					<BigNumber data-tip="Nombre de jours travaillés avant deadline">
						{project.daysUntilDeadline}&nbsp;
						<Plural
							value={project.daysUntilDeadline}
							singular="jour"
							plural="jours"
						/>
					</BigNumber>
				</SubSection>
			)}
		</Aside>
	);
};

export default withRouter(SidebarCustomerProjectInfos);