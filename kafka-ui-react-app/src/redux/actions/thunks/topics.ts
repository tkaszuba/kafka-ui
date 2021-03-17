import { v4 } from 'uuid';
import {
  TopicsApi,
  MessagesApi,
  Configuration,
  Topic,
  TopicFormData,
  TopicConfig,
} from 'generated-sources';
import {
  PromiseThunkResult,
  ClusterName,
  TopicName,
  TopicMessageQueryParams,
  TopicFormFormattedParams,
  TopicFormDataRaw,
  TopicsState,
} from 'redux/interfaces';
import { BASE_PARAMS } from 'lib/constants';
import * as actions from '../actions';

const apiClientConf = new Configuration(BASE_PARAMS);
export const topicsApiClient = new TopicsApi(apiClientConf);
export const messagesApiClient = new MessagesApi(apiClientConf);

export interface FetchTopicsListParams {
  clusterName: ClusterName;
  page?: number;
  perPage?: number;
}

export const fetchTopicsList = (
  params: FetchTopicsListParams
): PromiseThunkResult => async (dispatch, getState) => {
  dispatch(actions.fetchTopicsListAction.request());
  try {
    const { topics, pageCount } = await topicsApiClient.getTopics(params);
    const newState = (topics || []).reduce(
      (memo: TopicsState, topic) => ({
        ...memo,
        byName: {
          ...memo.byName,
          [topic.name]: {
            ...memo.byName[topic.name],
            ...topic,
            id: v4(),
          },
        },
        allNames: [...memo.allNames, topic.name],
      }),
      {
        ...getState().topics,
        allNames: [],
        totalPages: pageCount || 1,
      }
    );
    dispatch(actions.fetchTopicsListAction.success(newState));
  } catch (e) {
    dispatch(actions.fetchTopicsListAction.failure());
  }
};

export const fetchTopicMessages = (
  clusterName: ClusterName,
  topicName: TopicName,
  queryParams: Partial<TopicMessageQueryParams>
): PromiseThunkResult => async (dispatch) => {
  dispatch(actions.fetchTopicMessagesAction.request());
  try {
    const messages = await messagesApiClient.getTopicMessages({
      clusterName,
      topicName,
      ...queryParams,
    });
    dispatch(actions.fetchTopicMessagesAction.success(messages));
  } catch (e) {
    dispatch(actions.fetchTopicMessagesAction.failure());
  }
};

export const fetchTopicDetails = (
  clusterName: ClusterName,
  topicName: TopicName
): PromiseThunkResult => async (dispatch, getState) => {
  dispatch(actions.fetchTopicDetailsAction.request());
  try {
    const topicDetails = await topicsApiClient.getTopicDetails({
      clusterName,
      topicName,
    });
    const state = getState().topics;
    const newState = {
      ...state,
      byName: {
        ...state.byName,
        [topicName]: {
          ...state.byName[topicName],
          ...topicDetails,
        },
      },
    };
    dispatch(actions.fetchTopicDetailsAction.success(newState));
  } catch (e) {
    dispatch(actions.fetchTopicDetailsAction.failure());
  }
};

export const fetchTopicConfig = (
  clusterName: ClusterName,
  topicName: TopicName
): PromiseThunkResult => async (dispatch, getState) => {
  dispatch(actions.fetchTopicConfigAction.request());
  try {
    const config = await topicsApiClient.getTopicConfigs({
      clusterName,
      topicName,
    });

    const state = getState().topics;
    const newState = {
      ...state,
      byName: {
        ...state.byName,
        [topicName]: {
          ...state.byName[topicName],
          config: config.map((inputConfig) => ({
            ...inputConfig,
          })),
        },
      },
    };

    dispatch(actions.fetchTopicConfigAction.success(newState));
  } catch (e) {
    dispatch(actions.fetchTopicConfigAction.failure());
  }
};

const formatTopicFormData = (form: TopicFormDataRaw): TopicFormData => {
  const {
    name,
    partitions,
    replicationFactor,
    cleanupPolicy,
    retentionBytes,
    retentionMs,
    maxMessageBytes,
    minInSyncReplicas,
    customParams,
  } = form;

  return {
    name,
    partitions,
    replicationFactor,
    configs: {
      'cleanup.policy': cleanupPolicy,
      'retention.ms': retentionMs,
      'retention.bytes': retentionBytes,
      'max.message.bytes': maxMessageBytes,
      'min.insync.replicas': minInSyncReplicas,
      ...Object.values(customParams || {}).reduce(
        (result: TopicFormFormattedParams, customParam: TopicConfig) => {
          return {
            ...result,
            [customParam.name]: customParam.value,
          };
        },
        {}
      ),
    },
  };
};

export const createTopic = (
  clusterName: ClusterName,
  form: TopicFormDataRaw
): PromiseThunkResult => async (dispatch, getState) => {
  dispatch(actions.createTopicAction.request());
  try {
    const topic: Topic = await topicsApiClient.createTopic({
      clusterName,
      topicFormData: formatTopicFormData(form),
    });

    const state = getState().topics;
    const newState = {
      ...state,
      byName: {
        ...state.byName,
        [topic.name]: {
          ...topic,
        },
      },
      allNames: [...state.allNames, topic.name],
    };

    dispatch(actions.createTopicAction.success(newState));
  } catch (e) {
    dispatch(actions.createTopicAction.failure());
  }
};

export const updateTopic = (
  clusterName: ClusterName,
  form: TopicFormDataRaw
): PromiseThunkResult => async (dispatch, getState) => {
  dispatch(actions.updateTopicAction.request());
  try {
    const topic: Topic = await topicsApiClient.updateTopic({
      clusterName,
      topicName: form.name,
      topicFormData: formatTopicFormData(form),
    });

    const state = getState().topics;
    const newState = {
      ...state,
      byName: {
        ...state.byName,
        [topic.name]: {
          ...state.byName[topic.name],
          ...topic,
        },
      },
    };

    dispatch(actions.updateTopicAction.success(newState));
  } catch (e) {
    dispatch(actions.updateTopicAction.failure());
  }
};