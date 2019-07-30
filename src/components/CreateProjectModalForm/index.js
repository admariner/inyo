import styled from '@emotion/styled';
import moment from 'moment';
import React, {useRef, useState} from 'react';
import {useQuery} from 'react-apollo-hooks';
import useOnClickOutside from 'use-onclickoutside';

import {BREAKPOINTS} from '../../utils/constants';
import {FlexRow, ModalActions} from '../../utils/content';
import {formatName} from '../../utils/functions';
import {
	BigNumber,
	Button,
	DateContainer,
	InputLabel,
	Label,
	SubHeading,
} from '../../utils/new/design-system';
import {templates} from '../../utils/project-templates';
import {GET_ALL_CUSTOMERS} from '../../utils/queries';
import DateInput from '../DateInput';
import FormElem from '../FormElem';
import FormRadiosList from '../FormRadiosList';
import FormSelect from '../FormSelect';
import IconButton from '../IconButton';
import Tooltip from '../Tooltip';

const FormSubHeading = styled(SubHeading)`
	grid-column: 1 / 4;
`;

const CreateProjectRow = styled('div')`
	margin-top: 1rem;
	grid-column-end: span 3;
	${props => (props.leftMargin ? 'margin-left: -1rem;' : '')}

	${props => (props.third ? 'display: grid;' : '')}
	${props => (props.third ? 'grid-template-columns: 150px 1fr 150px;' : '')}
	${props => (props.third ? 'align-items: end;' : '')}

	@media (max-width: ${BREAKPOINTS}px) {
		display: block;
	}
`;

const CreateProjectElem = styled('div')`
	margin-right: 1rem;
	grid-column-end: ${props => (props.big ? 'span 2' : 'span 1')};
	${props => props.center
		&& `
		display: flex;
		align-items: center;
	`}
	${props => props.end
		&& `
		display: flex;
		align-items: flex-end;
		margin-bottom: 9px;
	`}
	${props => (props.leftMargin ? 'margin-left: -1rem;' : '')}

	@media (max-width: ${BREAKPOINTS}px) {
		margin-bottom: 1rem;
	}
`;

const CreateProjectGrid = styled('form')`
	display: grid;
	grid-template-columns: 400px 1fr 1fr;
	grid-row-gap: 1.5rem;

	@media (max-width: ${BREAKPOINTS}px) {
		display: flex;
		flex-direction: column;
	}
`;

const FlexRowButtons = styled(FlexRow)`
	@media (max-width: ${BREAKPOINTS}px) {
		flex-direction: column;

		button + button {
			margin: 10px 0;
		}
	}
`;

export default function ({
	optionsProjects,
	setViewContent,
	setCreateCustomer,
	addDeadline,
	setAddDeadline,
	addCustomer,
	setAddCustomer,
	setCustomerName,
	onDismiss,
	...props
}) {
	const [editDeadline, setEditDeadline] = useState(false);
	const {loading: loadingCustomers, data: dataCustomers} = useQuery(
		GET_ALL_CUSTOMERS,
		{
			suspend: true,
		},
	);

	let optionsCustomers = [];

	if (!loadingCustomers) {
		optionsCustomers = dataCustomers.me.customers.map(customer => ({
			value: customer.id,
			label: `${customer.name} (${formatName(
				customer.firstName,
				customer.lastName,
			)})`,
		}));
	}

	const dateRef = useRef();

	useOnClickOutside(dateRef, () => {
		setEditDeadline(false);
	});

	return (
		<CreateProjectGrid>
			<FormSubHeading>Créer un nouveau projet</FormSubHeading>
			<CreateProjectRow leftMargin>
				<FormElem
					{...props}
					name="name"
					type="text"
					label="Titre du projet"
					placeholder="Ex: Landing page nouvelle collection, etc."
					big
					noMarginBottom
				/>
			</CreateProjectRow>
			<CreateProjectRow third>
				<CreateProjectElem>
					<FormRadiosList
						{...props}
						name="source"
						options={[
							{
								id: 'BLANK',
								label: 'Projet vierge',
							},
							{
								id: 'MODELS',
								label: 'Nos modèles',
							},
							{
								id: 'PROJECTS',
								label: 'Vos projets',
							},
						]}
					/>
				</CreateProjectElem>
				{props.values.source === 'BLANK' && (
					<>
						<CreateProjectElem />
						<CreateProjectElem />
					</>
				)}
				{props.values.source === 'MODELS' && (
					<>
						<CreateProjectElem>
							<FormSelect
								{...props}
								name="modelTemplate"
								label="Titre du modèle"
								big
								classNamePrefix="intercom-tour"
								options={templates.map(template => ({
									value: template.name,
									label: template.label,
								}))}
							/>
						</CreateProjectElem>
						<CreateProjectElem center>
							<Button
								link
								disabled={!props.values.modelTemplate}
								onClick={(e) => {
									e.preventDefault();
									setViewContent(true);
								}}
							>
								<IconButton
									icon="infos"
									size="tiny"
									inactive={!props.values.modelTemplate}
									label="Voir le contenu"
								/>
							</Button>
						</CreateProjectElem>
					</>
				)}
				{props.values.source === 'PROJECTS' && (
					<>
						<CreateProjectElem>
							<FormSelect
								{...props}
								name="modelProject"
								label="Titre du projet"
								big
								classNamePrefix="intercom-tour"
								options={optionsProjects}
							/>
						</CreateProjectElem>
						<CreateProjectElem center>
							<Button
								link
								disabled={!props.values.modelProject}
								onClick={(e) => {
									e.preventDefault();
									setViewContent(true);
								}}
							>
								<IconButton
									icon="infos"
									size="tiny"
									inactive={!props.values.modelProject}
									label="Voir le contenu"
								/>
							</Button>
						</CreateProjectElem>
					</>
				)}
			</CreateProjectRow>
			{addCustomer && (
				<>
					<CreateProjectElem big leftMargin>
						<FormSelect
							{...props}
							onInputChange={(value, {action}) => {
								if (action === 'input-change') {
									setCustomerName(value);
								}
							}}
							handleBlur={() => {}}
							options={optionsCustomers}
							name="customerId"
							label="Client principal du projet"
							big
							css="width: 100%;"
						/>
					</CreateProjectElem>
					<CreateProjectElem end>
						<Button link onClick={() => setCreateCustomer(true)}>
							<IconButton
								icon="perm_contact_calendar"
								size="tiny"
								label="Créer un nouveau client"
							/>
						</Button>
					</CreateProjectElem>
				</>
			)}
			{(addDeadline || props.values.deadline) && (
				<CreateProjectElem>
					<InputLabel>
						<Label>Deadline</Label>
						<DateContainer>
							<Tooltip label="Date limite du projet">
								<BigNumber
									onClick={() => setEditDeadline(true)}
								>
									{(props.values.deadline
										&& moment(props.values.deadline).format(
											'DD/MM/YYYY',
										)) || <>&mdash;</>}
								</BigNumber>
							</Tooltip>
							{addDeadline && editDeadline && (
								<DateInput
									innerRef={dateRef}
									date={moment(
										props.values.deadline || new Date(),
									)}
									onDateChange={(date) => {
										props.setFieldValue(
											'deadline',
											date.toISOString(),
										);
										setEditDeadline(false);
									}}
									duration={0}
									position="right"
								/>
							)}
						</DateContainer>
					</InputLabel>
				</CreateProjectElem>
			)}
			{(!addCustomer || !addDeadline) && (
				<CreateProjectRow>
					<FlexRowButtons>
						{!addCustomer && (
							<Button
								aligned
								onClick={(e) => {
									e.preventDefault();
									setAddCustomer(true);
								}}
							>
								Ajouter un client
							</Button>
						)}
						{!addDeadline && (
							<Button
								aligned
								onClick={(e) => {
									e.preventDefault();
									setAddDeadline(true);
									setEditDeadline(true);
								}}
							>
								Ajouter une deadline
							</Button>
						)}
					</FlexRowButtons>
				</CreateProjectRow>
			)}
			<ModalActions>
				<Button link onClick={onDismiss}>
					Annuler
				</Button>
				<Button type="submit">Créer le projet</Button>
			</ModalActions>
		</CreateProjectGrid>
	);
}
