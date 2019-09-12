import {css} from '@emotion/core';
import styled from '@emotion/styled/macro';
import moment from 'moment';
import React, {useRef, useState} from 'react';
import {useMutation, useQuery} from 'react-apollo-hooks';
import useOnClickOutside from 'use-onclickoutside';

import fbt from '../../fbt/fbt.macro';
import {BREAKPOINTS, ITEM_TYPES} from '../../utils/constants';
import {
	FlexRow, gray50, gray70, LoadingLogo,
} from '../../utils/content';
import {
	formatName,
	isCustomerTask,
	taskFulfillsActivationCriteria,
} from '../../utils/functions';
import {
	CREATE_TAG,
	FOCUS_TASK,
	REMOVE_ATTACHMENTS,
	REMOVE_ITEM,
	UNFOCUS_TASK,
	UPDATE_ITEM,
} from '../../utils/mutations';
import {
	accentGrey,
	Button,
	DateInputContainer,
	DueDateInputElem,
	HR,
	Meta,
	MetaLabel,
	MetaText,
	MetaTime,
	P,
	primaryGrey,
	primaryPurple,
	StickyHeader,
	SubHeading,
	TaskHeading,
} from '../../utils/new/design-system';
import {GET_ITEM_DETAILS, GET_USER_INFOS} from '../../utils/queries';
import Apostrophe from '../Apostrophe';
import CheckList from '../CheckList';
import CommentList from '../CommentList';
import CustomersDropdown from '../CustomersDropdown';
import DateInput from '../DateInput';
import IconButton from '../IconButton';
import InlineEditable from '../InlineEditable';
import ItemViewAssigneeInput from '../ItemViewAssigneeInput';
import MaterialIcon from '../MaterialIcon';
import MultilineEditable from '../MultilineEditable';
import ProjectsDropdown from '../ProjectsDropdown';
import TagDropdown from '../TagDropdown';
import TaskActivationHeader from '../TaskActivationHeader';
import TaskActivationModal from '../TaskActivationModal';
import TaskRemindersList from '../TaskRemindersList';
import TaskStatusButton from '../TaskStatusButton';
import Tooltip from '../Tooltip';
import UnitInput from '../UnitInput';
import UploadDashboard from '../UploadDashboard';

const Header = styled('div')``;

const Metas = styled('div')`
	display: grid;
	grid-template-columns: 340px 1fr;
	grid-row-gap: 5px;
	color: ${gray50};
	padding-bottom: 2rem;
	font-size: 14px;

	@media (max-width: ${BREAKPOINTS}px) {
		display: flex;
		flex-direction: column;
		padding: 1rem 0;
	}
`;

const ClientDropdown = styled(CustomersDropdown)`
	margin-top: -6px;
	padding: 0;
`;

const StyledProjectsDropdown = styled(ProjectsDropdown)`
	margin-top: -6px;
	padding: 0;
`;

const Description = styled('div')`
	color: ${gray70};
	line-height: 1.6;
	margin-top: 20px;
	margin-bottom: 25px;
	margin-left: -4rem;
	margin-right: -4rem;
	background-color: #faf8fe;
	min-height: 5rem;
	display: flex;

	a {
		color: ${primaryPurple};

		&:hover {
			text-decoration: none;
		}
	}

	blockquote {
		border-left: 3px solid ${primaryPurple};
		padding-left: 1rem;
	}

	textarea {
		min-height: 5rem;
	}

	@media (max-width: ${BREAKPOINTS}px) {
		margin-left: -2rem;
		margin-right: -2rem;

		div {
			padding: 1rem 2rem !important;
		}
	}
`;

const Title = styled(TaskHeading)`
	display: flex;
	align-items: center;
	margin: 2rem 0;

	span {
		border: 1px solid transparent;
		padding: 12px 18px 13px;
		width: 100%;
	}
`;

const TaskHeadingIcon = styled('div')`
	position: relative;
	left: -5px;
	top: 4px;
`;

const AttachedList = styled('div')`
	margin-top: 20px;
	margin-bottom: 40px;

	a {
		color: ${primaryPurple};
		font-size: 0.85rem;
	}

	div + button {
		margin-top: 1rem;
	}
`;

const RemoveFile = styled(IconButton)`
	opacity: 0;
	margin-left: 3rem;
	transition: all 300ms ease;
`;

const Attachment = styled('div')`
	display: flex;
	align-items: center;

	&:hover ${RemoveFile} {
		opacity: 1;
		transition: all 200ms ease;
		margin-left: 1.5rem;
	}
`;

const FileContainer = styled('span')`
	margin-right: 0.7rem;
	margin-bottom: -0.3rem;
`;

const FileOwner = styled('span')`
	font-size: 12px;
	color: ${primaryGrey};

	:before {
		padding: 0 5px;
		content: '\\2014';
	}
`;
const TaskButton = styled(Button)`
	margin: 1rem 0 1.5rem;
`;

const FlexRowButtons = styled(FlexRow)`
	@media (max-width: ${BREAKPOINTS}px) {
		flex-direction: column;

		button + button {
			margin: 10px 0;
		}
	}
`;

const Item = ({
	id,
	customerToken,
	close,
	isActivating: initialIsActivating = false,
	scheduledFor: initialScheduledFor,
}) => {
	const [editCustomer, setEditCustomer] = useState(false);
	const [editDueDate, setEditDueDate] = useState(false);
	const [editUnit, setEditUnit] = useState(false);
	const [editProject, setEditProject] = useState(false);
	const [deletingItem, setDeletingItem] = useState(false);
	const [isActivating, setIsActivating] = useState(initialIsActivating);
	const dateRef = useRef();

	const {loading, data, error} = useQuery(GET_ITEM_DETAILS, {
		suspend: false,
		variables: {id, token: customerToken},
	});
	const {
		loading: loadingUser,
		data: {me},
		error: errorUser,
	} = useQuery(GET_USER_INFOS, {
		suspend: true,
	});

	const [updateItem] = useMutation(UPDATE_ITEM);
	const [focusTask] = useMutation(FOCUS_TASK);
	const [unfocusTask] = useMutation(UNFOCUS_TASK);
	const [createTag] = useMutation(CREATE_TAG);
	const [removeFile] = useMutation(REMOVE_ATTACHMENTS, {
		refetchQueries: ['getAllTasks'],
	});
	const [deleteItem] = useMutation(REMOVE_ITEM, {
		variables: {
			itemId: id,
		},
		optimisticReponse: {
			removeItem: {
				id,
			},
		},
	});

	useOnClickOutside(dateRef, () => {
		setEditDueDate(false);
	});

	if (loading || loadingUser) return <LoadingLogo />;
	if (error && error.graphQLErrors[0].message.includes('Non autorisé')) {
		return (
			<>
				<Header>Accès non autorisé</Header>
				<P>Vous n'avez pas ou plus accès a cette tâche.</P>
			</>
		);
	}
	if (error || errorUser) throw errorUser || error;

	const {item} = data;
	const {linkedCustomer: customer} = item;

	let {description} = item;
	const deadline
		= (item.dueDate || (item.section && item.section.project.deadline))
		&& new Date(
			item.dueDate || (item.section && item.section.project.deadline),
		);

	// parse the description for the file list
	let files = [];
	const fileListRegex = /([\s\S])*# content-acquisition-list(?:\n([^#]+)?)?$/;

	if (fileListRegex.test(item.description)) {
		const matches = item.description
			.match(fileListRegex)[0]
			.split('# content-acquisition-list');

		const fileItemRegex = /- \[([ x])\] (.+)/;

		files = matches
			.pop()
			.split('\n')
			.filter(line => fileItemRegex.test(line))
			.map(line => ({
				checked: /^- \[[x]]/.test(line),
				name: line.match(fileItemRegex).pop(),
			}));
		description = matches.join('# content-acquisition-list');
	}

	const typeInfo
		= ITEM_TYPES.find(({type}) => type === item.type)
		|| ITEM_TYPES.find(({type}) => type === 'DEFAULT');

	const customerTask = isCustomerTask(item.type);
	const finishableTask
		= (customerToken && customerTask) || (!customerToken && !customerTask);

	const activableTask = !customerToken && item.status === 'PENDING';

	if (isActivating) {
		return (
			<TaskActivationModal
				item={item}
				assistantName={me.settings.assistantName}
				initialScheduledFor={initialScheduledFor}
				focusTask={focusTask}
				setIsActivating={setIsActivating}
			/>
		);
	}

	let hasProjectCustomerLinked = false;

	if (
		!item.linkedCustomer
		|| (item.section
			&& item.section.project.customer
			&& item.section.project.customer.id === item.linkedCustomer.id)
	) {
		hasProjectCustomerLinked = true;
	}

	return (
		<>
			<StickyHeader customer={item.type !== 'DEFAULT'}>
				<TaskActivationHeader
					item={item}
					focusTask={focusTask}
					activableTask={activableTask}
					customerTask={customerTask}
					setIsActivating={setIsActivating}
				/>
			</StickyHeader>
			<Header>
				<Tooltip
					label={
						<fbt project="inyo" desc="Tooltip task title item view">
							Type et titre de la tâche
						</fbt>
					}
				>
					<Title>
						<TaskHeadingIcon>
							{item.status === 'FINISHED'
								? typeInfo.iconValidated
								: typeInfo.icon}
						</TaskHeadingIcon>
						<InlineEditable
							disabled={!!customerToken}
							editableCss={css`
								padding: 1rem 1.5rem;
							`}
							value={item.name}
							type="text"
							placeholder={
								<fbt
									project="inyo"
									desc="task name placeholder item view"
								>
									Nommez cette tâche
								</fbt>
							}
							onFocusOut={(value) => {
								if (value && value !== item.name) {
									updateItem({
										variables: {
											itemId: id,
											token: customerToken,
											name: value,
										},
									});
								}
							}}
						/>
					</Title>
				</Tooltip>
			</Header>
			<Metas>
				{customerToken
				|| item.status !== 'FINISHED'
				|| !item.timeItTook ? (
						<Tooltip
							label={
								<fbt
									project="inyo"
									desc="time estimated tooltip item view"
								>
								Temps estimé pour cette tâche
								</fbt>
							}
						>
							<Meta>
								<MaterialIcon icon="timer" size="tiny" />
								<MetaLabel>
									<fbt
										project="inyo"
										desc="time estimated label item view"
									>
									Temps estimé
									</fbt>
								</MetaLabel>
								<MetaText>
									{!customerToken && editUnit ? (
										<UnitInput
											unit={item.unit}
											onBlur={(unit) => {
												updateItem({
													variables: {
														itemId: item.id,
														unit,
													},
												});
												setEditUnit(false);
											}}
											onSubmit={(unit) => {
												updateItem({
													variables: {
														itemId: item.id,
														unit,
													},
												});
												setEditUnit(false);
											}}
											onTab={(unit) => {
												updateItem({
													variables: {
														itemId: item.id,
														unit,
													},
												});
												setEditUnit(false);
											}}
										/>
									) : (
										<div
											onClick={
												customerToken
													? undefined
													: () => setEditUnit(true)
											}
										>
											<fbt
												project="inyo"
												desc="time estimated item view"
											>
												<fbt:plural
													count={item.unit}
													name="timeEstimated"
													many="jours"
													value={item.unit.toFixed(2)}
													showCount="yes"
												>
												jour
												</fbt:plural>
											</fbt>
										</div>
									)}
								</MetaText>
							</Meta>
						</Tooltip>
					) : (
						<Tooltip
							label={
								<fbt
									project="inyo"
									desc="time it took tooltip item view"
								>
								Temps passé pour cette tâche
								</fbt>
							}
						>
							<Meta>
								<MaterialIcon icon="timer" size="tiny" />
								<MetaLabel>
									<fbt
										project="inyo"
										desc="time it took label item view"
									>
									Temps passé
									</fbt>
								</MetaLabel>
								<MetaText>
									{editUnit ? (
										<UnitInput
											unit={item.timeItTook}
											onBlur={(timeItTook) => {
												updateItem({
													variables: {
														itemId: item.id,
														timeItTook,
													},
												});
												setEditUnit(false);
											}}
											onSubmit={(timeItTook) => {
												updateItem({
													variables: {
														itemId: item.id,
														timeItTook,
													},
												});
												setEditUnit(false);
											}}
											onTab={(timeItTook) => {
												updateItem({
													variables: {
														itemId: item.id,
														timeItTook,
													},
												});
												setEditUnit(false);
											}}
										/>
									) : (
										<div onClick={() => setEditUnit(true)}>
											<fbt
												project="inyo"
												desc="time it took item view"
											>
												<fbt:plural
													count={item.timeItTook}
													name="timeItTook"
													many="jours"
													showCount="yes"
													value={item.timeItTook.toFixed(
														2,
													)}
												>
												jour
												</fbt:plural>
											</fbt>
										</div>
									)}
								</MetaText>
							</Meta>
						</Tooltip>
					)}
				{isCustomerTask(item.type) || !item.section ? (
					<Tooltip
						label={
							<fbt
								project="inyo"
								desc="linked customer tooltip item view"
							>
								Personne liée à cette tâche
							</fbt>
						}
					>
						<Meta>
							<MaterialIcon icon="person_outline" size="tiny" />
							<MetaLabel>
								<fbt
									project="inyo"
									desc="linked customer label item view"
								>
									Client
								</fbt>
							</MetaLabel>
							{!customerToken && editCustomer ? (
								<ClientDropdown
									id="projects"
									defaultMenuIsOpen
									defaultValue={
										item.linkedCustomer && {
											value: item.linkedCustomer.id,
											label: `${
												item.linkedCustomer.name
											} (${formatName(
												item.linkedCustomer.firstName,
												item.linkedCustomer.lastName,
											)})`,
										}
									}
									autoFocus
									onChange={(selection) => {
										updateItem({
											variables: {
												itemId: item.id,
												linkedCustomerId: selection
													? selection.value
													: null,
											},
										});
										setEditCustomer(false);
									}}
									onBlur={() => {
										setEditCustomer(false);
									}}
									isClearable={!hasProjectCustomerLinked}
								/>
							) : (
								<MetaText
									onClick={
										customerToken
											? undefined
											: () => setEditCustomer(true)
									}
								>
									{customer
										&& `${customer.name} (${formatName(
											customer.firstName,
											customer.lastName,
										)})`}
								</MetaText>
							)}
						</Meta>
					</Tooltip>
				) : (
					<ItemViewAssigneeInput
						customerToken={customerToken}
						taskId={item.id}
						assignee={item.assignee}
						linkedCollaborators={
							item.section
							&& item.section.project.linkedCollaborators
						}
					/>
				)}
				{(!deadline || deadline.toString() !== 'Invalid Date') && (
					<Tooltip
						label={
							<fbt
								project="inyo"
								desc="deadline tooltip item view"
							>
								Date limite pour réaliser cette tâche
							</fbt>
						}
					>
						<Meta>
							<MaterialIcon icon="event" size="tiny" />
							<MetaLabel>
								<fbt
									project="inyo"
									desc="deadline label item view"
								>
									Temps restant
								</fbt>
							</MetaLabel>
							<MetaTime
								title={deadline && deadline.toLocaleString()}
								dateTime={deadline && deadline.toJSON()}
								onClick={
									customerToken
										? undefined
										: () => !editDueDate
												&& setEditDueDate(true)
								}
							>
								{!customerToken && editDueDate ? (
									<DateInputContainer>
										<DueDateInputElem
											value={moment(
												deadline || new Date(),
											).format('DD/MM/YYYY')}
										/>
										<DateInput
											innerRef={dateRef}
											date={moment(
												deadline || new Date(),
											)}
											onDateChange={(date) => {
												updateItem({
													variables: {
														itemId: item.id,
														dueDate: date.toISOString(),
													},
												});
												setEditDueDate(false);
											}}
											duration={item.unit}
										/>
									</DateInputContainer>
								) : (
									deadline && (
										<div>
											<fbt
												project="inyo"
												desc="deadline margin item view"
											>
												<fbt:plural
													count={
														moment(deadline).diff(
															moment(),
															'days',
														) - item.unit
													}
													value={
														+(
															moment(
																deadline,
															).diff(
																moment(),
																'days',
															) - item.unit
														).toFixed(2)
													}
													many="jours"
												>
													jour
												</fbt:plural>
											</fbt>
										</div>
									)
								)}
							</MetaTime>
						</Meta>
					</Tooltip>
				)}
				<Tooltip
					label={
						<fbt project="inyo" desc="project tooltip">
							Projet lié à cette tâche
						</fbt>
					}
				>
					<Meta>
						<MaterialIcon icon="folder_open" size="tiny" />
						<MetaLabel>
							<fbt project="inyo" desc="project label">
								Projet
							</fbt>
						</MetaLabel>
						{!customerToken && editProject ? (
							<StyledProjectsDropdown
								id="projects"
								defaultMenuIsOpen
								autoFocus
								defaultValue={
									item.section
									&& item.section.project && {
										value: item.section.project.id,
										label: item.section.project.name,
									}
								}
								onChange={(option) => {
									updateItem({
										variables: {
											itemId: item.id,
											projectId: option
												? option.value
												: null,
										},
									});
									setEditProject(false);
								}}
								onBlur={() => {
									setEditProject(false);
								}}
								isClearable
							/>
						) : (
							<MetaText
								onClick={
									customerToken
										? undefined
										: () => setEditProject(true)
								}
							>
								{item.section
									&& item.section.project
									&& item.section.project.name}
							</MetaText>
						)}
					</Meta>
				</Tooltip>
				<Tooltip
					label={
						<fbt project="inyo" desc="type of the task tooltip">
							Définit s'il y a des actions automatiques
						</fbt>
					}
				>
					<Meta>
						<MaterialIcon icon="check_circle_outline" size="tiny" />
						<MetaLabel>
							<fbt project="inyo" desc="task type">
								Type de tâche
							</fbt>
						</MetaLabel>
						<MetaText>{typeInfo.name}</MetaText>
					</Meta>
				</Tooltip>
				{!customerToken && (
					<Tooltip
						label={
							<fbt project="inyo" desc="task's tag">
								Tag de la tâche
							</fbt>
						}
					>
						<Meta>
							<MaterialIcon icon="label" size="tiny" />
							<MetaLabel>Tags</MetaLabel>
							<TagDropdown
								id="tags"
								long
								placeholder={
									<fbt
										project="inyo"
										desc="add or create tag"
									>
										Ajouter ou créer un tag
									</fbt>
								}
								value={item.tags.map(tag => ({
									value: tag.id,
									label: tag.name,
									colorBg: tag.colorBg,
									colorText: tag.colorText,
								}))}
								onCreateOption={async (
									name,
									colorBg,
									colorText,
								) => {
									const {
										data: {createTag: tag},
									} = await createTag({
										variables: {
											name,
											colorBg,
											colorText,
										},
									});

									updateItem({
										variables: {
											itemId: item.id,
											tags: [
												...item.tags.map(i => i.id),
												tag.id,
											],
										},
									});
								}}
								onChange={(tags) => {
									updateItem({
										variables: {
											itemId: item.id,
											tags: tags.map(({value}) => value),
										},
									});
								}}
							/>
						</Meta>
					</Tooltip>
				)}
			</Metas>
			{(!customerToken || description) && (
				<Tooltip label="Description de la tâche">
					<Description>
						<MultilineEditable
							disabled={!!customerToken}
							placeholder={
								<fbt project="inyo" desc="Add a description">
									Ajouter une description…
								</fbt>
							}
							style={{padding: '1rem 4rem'}}
							onBlur={e => updateItem({
								variables: {
									itemId: id,
									token: customerToken,
									description: e.target.innerText.concat(
										files.length > 0
											? `\n# content-acquisition-list\n${files
												.map(
													({checked, name}) => `- [${
														checked
															? 'x'
															: ' '
													}] ${name}`,
												)
												.join('\n')}`
											: '',
									),
								},
							})
							}
							defaultValue={description}
						/>
					</Description>
				</Tooltip>
			)}
			{!customerToken
				&& customerTask
				&& taskFulfillsActivationCriteria(item) && (
					<>
						<SubHeading>
							<fbt project="inyo" desc="actions of edwige">
								Actions{' '}
								<fbt:param name="apos">
									<Apostrophe
										value={me.settings.assistantName}
										withVowel={
											<fbt
												project="inyo"
												desc="notification message"
											>
												d'
											</fbt>
										}
										withConsonant={
											<fbt
												project="inyo"
												desc="notification message"
											>
												de{' '}
											</fbt>
										}
									/>
								</fbt:param>
								<fbt:param name="assistantName">
									{me.settings.assistantName}
								</fbt:param>
							</fbt>
						</SubHeading>
						{item.isFocused ? (
							<>
								<TaskRemindersList
									noLink
									reminders={item.reminders}
								/>
								<TaskButton
									onClick={() => {
										unfocusTask({
											variables: {itemId: item.id},
										});
									}}
									icon="×"
								>
									Ne plus rappeler à{' '}
									{item.linkedCustomer.name} (
									{formatName(
										item.linkedCustomer.firstName,
										item.linkedCustomer.lastName,
									)}
									) de faire cette tâche
								</TaskButton>
							</>
						) : (
							<TaskButton
								onClick={() => {
									if (item.type === 'CONTENT_ACQUISITION') {
										focusTask({
											variables: {itemId: item.id},
										});
									}
									else {
										setIsActivating(true);
									}
								}}
								icon="✓"
							>
								<fbt project="inyo" desc="charger">
									Charger{' '}
									<fbt:param name="assistantName">
										{me.settings.assistantName}
									</fbt:param>{' '}
									de faire réaliser cette tâche à{' '}
									<fbt:param name="customerName">
										{item.linkedCustomer.name}
									</fbt:param>{' '}
									(
									<fbt:param name="contactName">
										{formatName(
											item.linkedCustomer.firstName,
											item.linkedCustomer.lastName,
										)}
									</fbt:param>
									)
								</fbt>
							</TaskButton>
						)}
					</>
			)}
			<SubHeading>
				<fbt project="inyo" desc="Attached files">
					Pièces jointes
				</fbt>
			</SubHeading>
			<AttachedList>
				{item.attachments.map(
					({
						url, filename, id: attachmentId, owner,
					}) => {
						const isOwner
							= owner
							&& ((customerToken
								&& owner.__typename === 'Customer')
								|| (!customerToken
									&& owner.__typename === 'User'));

						return (
							<Attachment key={attachmentId}>
								<FileContainer>
									<MaterialIcon
										icon="attachment"
										size="tiny"
										color={accentGrey}
									/>
								</FileContainer>
								<a
									href={url}
									target="_blank"
									rel="noopener noreferrer"
								>
									{filename}
								</a>
								{owner && !isOwner && (
									<FileOwner>
										{owner.firstName} {owner.lastName}
									</FileOwner>
								)}
								{(!customerToken || isOwner) && (
									<RemoveFile
										icon="delete_forever"
										size="tiny"
										danger
										onClick={async () => {
											await removeFile({
												variables: {
													token: customerToken,
													attachmentId,
												},
											});
										}}
									/>
								)}
							</Attachment>
						);
					},
				)}
				<UploadDashboard
					customerToken={customerToken}
					taskId={item.id}
				/>
			</AttachedList>
			{item.type === 'CONTENT_ACQUISITION' && (
				<>
					<SubHeading>Contenus à récupérer</SubHeading>
					<CheckList
						editable={!customerToken} // editable by user only, but checkable
						items={files}
						onChange={({items}) => {
							updateItem({
								variables: {
									itemId: id,
									token: customerToken,
									description: description.concat(
										items.length > 0
											? `\n# content-acquisition-list\n${items
												.map(
													({checked, name}) => `- [${
														checked
															? 'x'
															: ' '
													}] ${name}`,
												)
												.join('\n')}`
											: '',
									),
								},
							});
						}}
					/>
				</>
			)}
			<SubHeading>
				<fbt project="inyo" desc="Comments">
					Commentaires
				</fbt>
			</SubHeading>
			<CommentList
				itemId={item.id}
				customerToken={customerToken}
				linkedCustomer={item.linkedCustomer}
			/>
			<HR />
			<FlexRowButtons justifyContent="space-between">
				<FlexRowButtons>
					{!customerToken
						&& (deletingItem ? (
							<>
								<Button
									grey
									aligned
									onClick={() => setDeletingItem(false)}
								>
									<fbt project="inyo" desc="cancel">
										Annuler
									</fbt>
								</Button>
								<Button
									red
									aligned
									onClick={() => {
										deleteItem();
										close();
									}}
								>
									<fbt project="inyo" desc="confirm deletion">
										Confirmer la suppression
									</fbt>
								</Button>
							</>
						) : (
							<>
								<Button
									red
									onClick={() => setDeletingItem(true)}
									aligned
								>
									<fbt project="inyo" desc="delete task">
										Supprimer la tâche
									</fbt>
								</Button>
							</>
						))}
					{finishableTask && (
						<TaskStatusButton
							item={item}
							primary={item.status === 'FINISHED'}
							isFinished={item.status === 'FINISHED'}
							customerToken={customerToken}
							aligned
						/>
					)}
				</FlexRowButtons>
				<div>
					<Button id="save-change-task" onClick={() => close()}>
						<fbt project="inyo" desc="notification message">
							Enregistrer et fermer
						</fbt>
					</Button>
				</div>
			</FlexRowButtons>
		</>
	);
};

export default Item;
