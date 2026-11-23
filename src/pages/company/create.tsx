import React from 'react'
import { CompanyList } from './list'
import { Form, Input, Modal, Select, Upload, Button, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import CustomAvatar from '@/components/custom-avatar'
import { resizeCompanyImage, setCompanyAvatarOverride } from '@/utilities/company-avatar'
import { useModalForm, useSelect } from '@refinedev/antd'
import { useGo } from '@refinedev/core'
import { CREATE_COMPANY_MUTATION } from '@/graphql/mutations'
import { USERS_SELECT_QUERY } from '@/graphql/queries'
import SelectOptionWithAvatar from '@/components/select-option-with-avatar'
import { GetFieldsFromList } from '@refinedev/nestjs-query'
import { UsersSelectQuery } from '@/graphql/types'

const Create = () => {
  const go = useGo();
  const [companyImage, setCompanyImage] = React.useState<string>();

  const goToListPage = (preserveQuery = true) => {
    go({
      to: '/companies',
      options: { keepQuery: preserveQuery },
      type: 'replace',
    })
  }

  const { formProps, modalProps } = useModalForm({
    action: 'create',
    defaultVisible: true,
    resource: 'companies',
    redirect: false,
    mutationMode: 'pessimistic',
    onMutationSuccess: (data) => {
      const companyId = data?.data?.id;
      if (companyId && companyImage) {
        setCompanyAvatarOverride(String(companyId), companyImage);
      }
      goToListPage(false);
    },
    meta: {
      gqlMutation: CREATE_COMPANY_MUTATION
    }
  })

  const { selectProps, queryResult } = useSelect<GetFieldsFromList<UsersSelectQuery>>({
    resource: 'users',
    optionLabel: 'name',
    meta: {
      gqlQuery: USERS_SELECT_QUERY
    }
  })

  return (
    <CompanyList>
      <Modal
        {...modalProps}
        mask={true}
        onCancel={() => goToListPage()}
        title="Create Company"
        width={512}
      >
        <Form {...formProps} layout="vertical">
          <Form.Item label="Company image">
            <Space align="center">
              <CustomAvatar
                shape="square"
                size={64}
                src={companyImage}
                name="Company"
              />
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={async (file) => {
                  try {
                    setCompanyImage(await resizeCompanyImage(file));
                  } catch (error) {
                    console.error(error);
                  }
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload image</Button>
              </Upload>
            </Space>
          </Form.Item>
          <Form.Item
            label="Company name"
            name="name"
            rules={[{required: true}]}
          >
            <Input placeholder="Please enter a company name" />
          </Form.Item>
          <Form.Item
            label="Sales owner"
            name="salesOwnerId"
            rules={[{required: true}]}
          >
            <Select 
              placeholder="Please select a sales owner"
              {...selectProps}
              options={
                queryResult.data?.data.map((user) => ({
                  value: user.id,
                  label: (
                    <SelectOptionWithAvatar 
                      name={user.name}
                      avatarUrl={user.avatarUrl ?? undefined}
                    />
                  )
                })) ?? []
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </CompanyList>
  )
}

export default Create