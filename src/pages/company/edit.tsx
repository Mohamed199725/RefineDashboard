import React from 'react'
import { Col, Form, Input, InputNumber, Row, Select, Upload, Button, Space } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { Edit, useForm, useSelect } from '@refinedev/antd'
import { UPDATE_COMPANY_MUTATION } from '@/graphql/mutations';
import CustomAvatar from '@/components/custom-avatar';
import { getNameInitials } from '@/utilities';
import { GetFieldsFromList } from '@refinedev/nestjs-query';
import { UsersSelectQuery } from '@/graphql/types';
import { USERS_SELECT_QUERY } from '@/graphql/queries';
import SelectOptionWithAvatar from '@/components/select-option-with-avatar';
import { businessTypeOptions, companySizeOptions, industryOptions } from '@/constants';
import { CompanyContactsTable } from './contacts-table';
import { getCompanyAvatarOverride, resizeCompanyImage, setCompanyAvatarOverride } from '@/utilities/company-avatar';

const EditPage = () => {
  const { saveButtonProps, formProps, formLoading, queryResult } = useForm({
    redirect: false,
    meta: {
      gqlMutation: UPDATE_COMPANY_MUTATION
    }
  });

  const { avatarUrl, name } = queryResult?.data?.data || {}
  const companyId =
    queryResult?.data?.data?.id === undefined
      ? undefined
      : String(queryResult.data.data.id);
  const [companyImage, setCompanyImage] = React.useState<string>();

  React.useEffect(() => {
    setCompanyImage(getCompanyAvatarOverride(companyId));
  }, [companyId]);

  const displayedAvatar = companyImage || avatarUrl;

  const { selectProps, queryResult: queryResultUsers } = useSelect<GetFieldsFromList<UsersSelectQuery>>({
    resource: 'users',
    optionLabel: 'name',
    pagination: {
      mode: 'off'
    },
    meta: {
      gqlQuery: USERS_SELECT_QUERY
    }
  })

  return (
    <div>
      <Row gutter={[32, 32]}>
        <Col xs={24} xl={12}>
          <Edit 
            isLoading={formLoading}
            saveButtonProps={saveButtonProps}
            breadcrumb={false}
          >
            <Form {...formProps} layout='vertical'>
              <Space align="center" style={{ marginBottom: '24px' }}>
                <CustomAvatar shape="square" src={displayedAvatar} name={getNameInitials(name || '')} style={{ width: 96, height: 96 }} />
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={async (file) => {
                    try {
                      const image = await resizeCompanyImage(file);
                      setCompanyImage(image);
                      if (companyId) setCompanyAvatarOverride(String(companyId), image);
                    } catch (error) {
                      console.error(error);
                    }
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>Change image</Button>
                </Upload>
              </Space>
          <Form.Item
            label="Sales owner"
            name="salesOwnerId"
            initialValue={formProps?.initialValues?.salesOwner?.id}
          >
            <Select 
              placeholder="Please select a sales owner"
              {...selectProps}
              options={
                queryResultUsers.data?.data.map((user) => ({
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
          <Form.Item label="Company size" name="companySize">
            <Select options={companySizeOptions} />
          </Form.Item>
          <Form.Item label="Total revenue" name="totalRevenue">
            <InputNumber 
              autoFocus
              addonBefore='$'
              min={0}
              max={2147483647}
              precision={0}
              step={1}
              placeholder="0"
              style={{ width: "100%" }}
            />
          </Form.Item>
          <Form.Item label="Industry" name="industry">
            <Select options={industryOptions} />
          </Form.Item>
          <Form.Item label="Business type" name="businessType">
            <Select options={businessTypeOptions} />
          </Form.Item>
          <Form.Item label="Country" name="country">
            <Input placeholder='Country' />
          </Form.Item>
          <Form.Item label="Website" name="website">
            <Input placeholder="Website" />
          </Form.Item>
            </Form>
          </Edit>
        </Col>
        <Col xs={24} xl={12}>
          <CompanyContactsTable />
        </Col>
      </Row>
    </div>
  )
}

export default EditPage