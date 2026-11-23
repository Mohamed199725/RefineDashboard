import { UnorderedListOutlined } from '@ant-design/icons'
import { Alert, Card, List, Space } from 'antd'
import React from 'react'
import { Text } from '../text'
import LatestActivitiesSkeleton from '../skeleton/latest-activities'
import { useList } from '@refinedev/core'
import { DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY, DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY } from '@/graphql/queries'
import dayjs from 'dayjs'
import CustomAvatar from '../custom-avatar'

const LatestActivities = () => {
  const {
    data: audit,
    isLoading: isLoadingAudit,
    isError: isAuditError,
    error: auditError,
  } = useList({
    resource: 'audits',
    meta: {
      gqlQuery: DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY
    }
  })

  const dealAudits =
    audit?.data.filter((item) =>
      item.targetEntity.toLowerCase().includes("deal"),
    ) ?? [];
  const dealIds = dealAudits.map((item) => item.targetId);

  const {
    data: deals,
    isLoading: isLoadingDeals,
    isError: isDealsError,
    error: dealsError,
  } = useList({
    resource: 'deals',
    queryOptions: { enabled: !!dealIds?.length },
    pagination: {
      mode: 'off'
    },
    filters: [{ field: 'id', operator: 'in', value: dealIds }],
    meta: {
      gqlQuery: DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY
    }
  })

  if (isAuditError || isDealsError) {
    const error = auditError ?? dealsError;

    return (
      <Alert
        type="error"
        showIcon
        message="Unable to load latest activities"
        description={
          error instanceof Error ? error.message : "Please try again later."
        }
      />
    );
  }

  const isLoading = isLoadingAudit || isLoadingDeals; 

  return (
    <Card
      headStyle={{ padding: '16px'}}
      bodyStyle={{ padding: '0 1rem'}}
      title={(
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px'}}>
            <UnorderedListOutlined />
            <Text size="sm" style={{ marginLeft: '0.5rem'}}>
              Latest Activities
            </Text>
        </div>
      )}
    >
      {isLoading ? (
        <List 
          itemLayout='horizontal'
          dataSource={Array.from({ length: 5})
            .map((_, i) => ({ id: i}))}
            renderItem={(_, index) => (
              <LatestActivitiesSkeleton key={index} />
            )}
        />
      ): (
        <List 
          itemLayout='horizontal'
          dataSource={dealAudits}
          renderItem={(item) => {
            const deal = deals?.data.find(
              (deal) => deal.id === String(item.targetId),
            );

            return (
              <List.Item>
                <List.Item.Meta 
                  title={dayjs(item.createdAt)
                    .year(dayjs().year())
                    .format('MMM DD, YYYY - HH:mm')}
                  avatar={
                    <CustomAvatar 
                      shape="square"
                      size={48}
                      src={deal?.company.avatarUrl}
                      name={deal?.company.name}
                    />
                  }
                  description={
                    <Space size={4}>
                      <Text strong>{item.user?.name}</Text>
                      <Text>
                        {item.action === 'CREATE' ? 'created' : 'updated'}
                      </Text>
                      <Text strong> {deal?.title}</Text>
                      <Text>deal</Text>
                      <Text strong>
                      {deal?.stage?.title}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )
          }}
        />
      )}
    </Card>
  )
}

export default LatestActivities