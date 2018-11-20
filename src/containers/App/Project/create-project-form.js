import React from 'react';
import {Formik} from 'formik';
import styled from 'react-emotion';
import * as Yup from 'yup';
import {Mutation, Query} from 'react-apollo';
import Creatable from 'react-select/lib/Creatable';
import ClassicSelect from 'react-select';
import ReactGA from 'react-ga';
import {templates} from '../../../utils/project-templates';

import {
	H1,
	H3,
	H4,
	Button,
	primaryBlue,
	primaryNavyBlue,
	FlexRow,
	ErrorInput,
	Label,
	Loading,
} from '../../../utils/content';
import FormElem from '../../../components/FormElem';
import FormSelect from '../../../components/FormSelect';
import AddressAutocomplete from '../../../components/AddressAutocomplete';
import {CREATE_PROJECT} from '../../../utils/mutations';
import {GET_ALL_PROJECTS, GET_USER_INFOS} from '../../../utils/queries';

const Title = styled(H1)`
	color: ${primaryNavyBlue};
`;

const SubTitle = styled(H3)`
	color: ${primaryBlue};
`;

const FormTitle = styled(H4)`
	color: ${primaryBlue};
`;

const FormSection = styled('div')`
	margin-left: ${props => (props.right ? '40px' : 0)};
	margin-right: ${props => (props.left ? '40px' : 0)};
`;

const SelectStyles = {
	option: (base, state) => ({
		...base,
		borderRadius: 0,
		fontFamily: 'Ligne',
	}),
	menu: (base, state) => ({
		...base,
		marginTop: 2,
		borderRadius: 0,
		fontFamily: 'Ligne',
	}),
	control: base => ({
		...base,
		width: '30vw',
		maxWidth: '500px',
		borderRadius: 0,
		fontFamily: 'Ligne',
	}),
	input: (base, state) => ({
		...base,
		fontFamily: 'Ligne',
		marginTop: '5px',
	}),
};

const projectTemplates = templates.map(template => ({
	value: template.name,
	label: template.label,
}));

class CreateProjectForm extends React.Component {
	render() {
		const {customers, onCreate} = this.props;

		return (
			<Query query={GET_USER_INFOS}>
				{({client, loading, data}) => {
					if (loading) return <Loading />;
					if (data && data.me) {
						const {me} = data;
						const {defaultDailyPrice} = me;

						return (
							<Mutation mutation={CREATE_PROJECT}>
								{createProject => (
									<Formik
										initialValues={{
											customer: '',
											template: '',
											firstName: '',
											lastName: '',
											email: '',
											projectTitle: '',
											title: '',
										}}
										validate={(values) => {
											const errors = {};

											if (!values.customer) {
												errors.customer = 'Requis';
											}
											else {
												const selectedCustomer
													= values.customer
													&& customers.find(
														c => c.id
															=== values.customer.id,
													);
												const newCustomer
													= !selectedCustomer
													&& values.customer;

												if (newCustomer) {
													if (!values.email) {
														errors.email = 'Requis';
													}
													else if (
														!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,10}$/i.test(
															values.email,
														)
													) {
														errors.email
															= 'Email invalide';
													}
												}
											}
											if (!values.template) {
												errors.template = 'Requis';
											}
											else if (
												values.template !== 'WEBSITE'
												&& values.template
													!== 'IDENTITY'
												&& values.template !== 'BLANK'
											) {
												errors.template
													= 'Template invalide';
											}
											if (!values.projectTitle) {
												errors.projectTitle = 'Requis';
											}

											return errors;
										}}
										onSubmit={async (values, actions) => {
											actions.setSubmitting(true);
											const customer = customers.find(
												c => c.id === values.customer.id,
											);

											const variables = {
												template: values.template,
												name: values.projectTitle,
											};

											if (customer) {
												variables.customerId
													= customer.id;
											}
											else {
												variables.customer = {
													name: values.customer.value,
													firstName: values.firstName,
													lastName: values.lastName,
													email: values.email,
													title: values.title,
												};
											}

											const selectedTemplate = templates.find(
												t => t.name === values.template,
											);
											let sections = [];

											if (selectedTemplate) {
												sections
													= selectedTemplate.sections;
											}

											variables.sections = sections;

											try {
												const result = await createProject(
													{
														variables,
														update: (
															cache,
															{
																data: {
																	createProject,
																},
															},
														) => {
															const data = cache.readQuery(
																{
																	query: GET_ALL_PROJECTS,
																},
															);

															data.me.company.projects.push(
																createProject,
															);
															try {
																cache.writeQuery(
																	{
																		query: GET_ALL_PROJECTS,
																		data,
																	},
																);
																ReactGA.event({
																	category:
																		'Project',
																	action:
																		'Created project',
																});
																window.$crisp.push(
																	[
																		'set',
																		'session:event',
																		[
																			[
																				[
																					'project_created',
																					{
																						template:
																							values.template,
																					},
																					'blue',
																				],
																			],
																		],
																	],
																);
																const projectNumber = window.$crisp.get(
																	'session:data',
																	'project_count',
																);

																if (
																	projectNumber
																) {
																	window.$crisp.push(
																		[
																			'set',
																			'session:data',
																			[
																				[
																					[
																						'project_count',
																						projectNumber
																							+ 1,
																					],
																				],
																			],
																		],
																	);
																}
																else {
																	window.$crisp.push(
																		[
																			'set',
																			'session:data',
																			[
																				[
																					[
																						'project_count',
																						1,
																					],
																				],
																			],
																		],
																	);
																}
																if (
																	variables.customer
																) {
																	window.$crisp.push(
																		[
																			'set',
																			'session:event',
																			[
																				[
																					[
																						'customer_created',
																						{},
																						'pink',
																					],
																				],
																			],
																		],
																	);
																	const customerNumber = window.$crisp.get(
																		'session:data',
																		'customer_count',
																	);

																	if (
																		customerNumber
																	) {
																		window.$crisp.push(
																			[
																				'set',
																				'session:data',
																				[
																					[
																						[
																							'customer_count',
																							customerNumber
																								+ 1,
																						],
																					],
																				],
																			],
																		);
																	}
																	else {
																		window.$crisp.push(
																			[
																				'set',
																				'session:data',
																				[
																					[
																						[
																							'customer_count',
																							1,
																						],
																					],
																				],
																			],
																		);
																	}
																	ReactGA.event(
																		{
																			category:
																				'Customer',
																			action:
																				'Created customer',
																		},
																	);
																}
															}
															catch (e) {
																console.log(e);
															}
														},
													},
												);

												onCreate(
													result.data.createProject,
												);
												actions.setSubmitting(false);
											}
											catch (error) {
												actions.setSubmitting(false);
												actions.setErrors(error);
												actions.setStatus({
													msg: `Quelque chose ne s'est pas passé comme prévu. ${error}`,
												});
											}
										}}
									>
										{(props) => {
											const {
												values,
												setFieldValue,
												status,
												isSubmitting,
												errors,
												touched,
											} = props;
											const selectedCustomer
												= values.customer
												&& customers.find(
													c => c.id
														=== values.customer.id,
												);
											const newCustomer
												= !selectedCustomer
												&& values.customer;

											return (
												<div>
													<form
														onSubmit={
															props.handleSubmit
														}
													>
														<Title>
															Créez votre projet
														</Title>
														<FlexRow>
															<FormSection left>
																<SubTitle>
																	1. Votre
																	client
																</SubTitle>
																<Label required>
																	Entrez le
																	nom de
																	l'entreprise
																	de votre
																	client
																</Label>
																<Creatable
																	id="customer"
																	name="customer"
																	options={customers.map(
																		customer => ({
																			...customer,
																			label:
																				customer.name,
																			value:
																				customer.id,
																		}),
																	)}
																	getOptionValue={option => option.id
																	}
																	onChange={(option) => {
																		setFieldValue(
																			'customer',
																			option,
																		);
																	}}
																	styles={
																		SelectStyles
																	}
																	value={
																		values.customer
																	}
																	isClearable
																	placeholder="Dubois SARL"
																	formatCreateLabel={inputValue => `Créer "${inputValue}"`
																	}
																/>
																{errors.customer
																	&& touched.customer && (
																	<ErrorInput
																	>
																		{
																			errors.customer
																		}
																	</ErrorInput>
																)}
																{!selectedCustomer
																	&& values.customer && (
																	<div>
																		<FormTitle
																		>
																				Il
																				semblerait
																				que
																				ce
																				soit
																				un
																				nouveau
																				client
																				!
																		</FormTitle>
																		<p>
																				Pourriez-vous
																				nous
																				en
																				dire
																				plus
																				?
																		</p>
																		<FlexRow
																		>
																			<FormSelect
																				{...props}
																				label="Civilité"
																				name="title"
																				paddedRight
																				options={[
																					{
																						value: undefined,
																						label:
																								'',
																					},
																					{
																						value:
																								'MONSIEUR',
																						label:
																								'M.',
																					},
																					{
																						value:
																								'MADAME',
																						label:
																								'Mme',
																					},
																				]}
																			/>
																			<FormElem
																				{...props}
																				label="Le prénom de votre contact"
																				name="firstName"
																				placeholder="John"
																			/>
																		</FlexRow>
																		<FormElem
																			{...props}
																			label="Le nom de votre contact"
																			name="lastName"
																			placeholder="Doe"
																		/>
																		<FormElem
																			{...props}
																			label="Son email"
																			name="email"
																			placeholder="contact@company.com"
																			required
																		/>
																	</div>
																)}
															</FormSection>

															<FormSection right>
																<SubTitle>
																	2. Votre
																	projet
																</SubTitle>
																<Label>
																	Nous pouvons
																	pré-remplir
																	votre projet
																	pour vous
																</Label>
																<ClassicSelect
																	styles={
																		SelectStyles
																	}
																	defaultValue="WEBSITE"
																	placeholder="Type de projet"
																	onChange={(option) => {
																		setFieldValue(
																			'template',
																			option
																				&& option.value,
																		);
																	}}
																	options={
																		projectTemplates
																	}
																/>
																{errors.template
																	&& touched.template && (
																	<ErrorInput
																	>
																		{
																			errors.template
																		}
																	</ErrorInput>
																)}
																<FormElem
																	required
																	{...props}
																	label="Titre de votre projet"
																	name="projectTitle"
																	placeholder="Nom du projet"
																/>
																{status
																	&& status.msg && (
																	<ErrorInput
																	>
																		{
																			status.msg
																		}
																	</ErrorInput>
																)}

																<br />
																<Button
																	type="submit"
																	theme={
																		isSubmitting
																			? 'Disabled'
																			: 'Primary'
																	}
																	disabled={
																		isSubmitting
																	}
																	size="Large"
																>
																	Créez votre
																	projet
																</Button>
															</FormSection>
														</FlexRow>
													</form>
												</div>
											);
										}}
									</Formik>
								)}
							</Mutation>
						);
					}
				}}
			</Query>
		);
	}
}

export default CreateProjectForm;