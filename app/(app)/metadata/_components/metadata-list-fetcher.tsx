"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import {
  getMetadataRecordsForUserAction,
  getMetadataRecordsByOrgAction
} from "@/actions/db/metadata-records-actions"
import { SelectMetadataRecord } from "@/db/schema"
import { getManagedOrganizationsAction } from "@/actions/db/organizations-actions"
import MetadataListClient from "./metadata-list" // This will be the client component
import { hasPermission } from "@/lib/rbac"

export default async function MetadataListFetcher() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/login") // Should be caught by page or middleware earlier
  }

  let records: SelectMetadataRecord[] = []
  const recordIds = new Set<string>()

  // 1. Fetch records created by the user
  const userRecordsAction = await getMetadataRecordsForUserAction()
  if (userRecordsAction.isSuccess && userRecordsAction.data) {
    userRecordsAction.data.forEach(record => {
      if (!recordIds.has(record.id)) {
        records.push(record)
        recordIds.add(record.id)
      }
    })
  }

  // 2. Fetch records for organizations the user is a Node Officer for
  const managedOrgsAction = await getManagedOrganizationsAction()
  if (managedOrgsAction.isSuccess && managedOrgsAction.data) {
    for (const org of managedOrgsAction.data) {
      const orgRecordsAction = await getMetadataRecordsByOrgAction(org.id)
      if (orgRecordsAction.isSuccess && orgRecordsAction.data) {
        orgRecordsAction.data.forEach(record => {
          if (!recordIds.has(record.id)) {
            records.push(record)
            recordIds.add(record.id)
          }
        })
      }
    }
  }

  // 3. If user is an admin (e.g. has manage:metadata), fetch all records (or a specific subset like PendingValidation)
  // For now, this is a placeholder. An admin might see all records, or we could add a filter for them.
  const isAdmin = await hasPermission(userId, "manage", "metadata")
  if (isAdmin && records.length === 0) {
    // Example: If admin and no records found yet, maybe fetch all pending?
    // const pendingRecordsAction = await getMetadataRecordsByStatusAction("PendingValidation");
    // if (pendingRecordsAction.isSuccess && pendingRecordsAction.data) {
    //   pendingRecordsAction.data.forEach(record => {
    //     if (!recordIds.has(record.id)) {
    //       records.push(record);
    //       recordIds.add(record.id);
    //     }
    //   });
    // }
    // For a true "admin sees all", you might need a dedicated get_all_metadata_action without org/user filters,
    // or paginate through all organizations. This is simplified for now.
  }

  // Sort records by updatedAt descending before passing to client
  records.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  // Pass a flag if there were issues fetching primary data sources (user/org records)
  // and the user isn't an admin who might have other ways to see data.
  const errorLoadingPrimaryData =
    !userRecordsAction.isSuccess &&
    (managedOrgsAction.data ? !managedOrgsAction.isSuccess : true) // only error if orgs were expected

  if (errorLoadingPrimaryData && !isAdmin && records.length === 0) {
    return <MetadataListClient initialRecords={[]} errorLoading={true} />
  }

  return <MetadataListClient initialRecords={records} />
}
