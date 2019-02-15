import gql from 'graphql-tag'; // eslint-disable-line import/no-extraneous-dependencies

export const ITEM_FRAGMENT = gql`
	fragment ItemFragment on Item {
		id
		description
		dueDate
		name
		position
		reviewer
		status
		type
		unit
		linkedCustomer {
			id
			name
		}

		section {
			id
			project {
				id
				deadline
				daysUntilDeadline
				status
				customer {
					id
					name
				}
			}
		}

		comments {
			createdAt
			id
			views {
				viewer {
					... on User {
						firstName
						lastName
					}
					... on Customer {
						firstName
						lastName
						name
					}
				}
			}
			author {
				... on User {
					firstName
					lastName
				}
				... on Customer {
					firstName
					lastName
					name
				}
			}
		}
	}
`;

/** ******** APP QUERIES ********* */
export const GET_NETWORK_STATUS = gql`
	query getNetworkStatus {
		networkStatus @client {
			isConnected
		}
	}
`;
