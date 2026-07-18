import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput, Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { clipboardApi } from '../api/clipboard'
import { formatExpiry, formatDate } from '../utils/format'

export default function ClipboardDetailScreen({ route, navigation }) {
  const { code } = route.params
  const [clipboard, setClipboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    navigation.setOptions({ title: code })
    fetchClipboard()
  }, [code])

  const fetchClipboard = async () => {
    setLoading(true)
    try {
      const data = await clipboardApi.get(code)
      setClipboard(data)
      setEditContent(data.content || '')
    } catch (e) {
      const s = e.response?.status
      setError(s === 403 ? 'password_required' : s === 410 ? 'gone' : 'not_found')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await clipboardApi.update(code, { content: editContent })
      setClipboard(updated)
      setEditing(false)
    } catch {
      Alert.alert('Error', 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete', 'Delete this clipboard permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await clipboardApi.delete(code)
            navigation.goBack()
          } catch {
            Alert.alert('Error', 'Failed to delete')
          }
        },
      },
    ])
  }

  const copyContent = async () => {
    if (clipboard?.content) {
      await Clipboard.setStringAsync(clipboard.content)
      Alert.alert('Copied', 'Content copied to clipboard')
    }
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#F5C518" />
    </View>
  )

  if (error) return (
    <View style={styles.center}>
      <Text style={styles.errorEmoji}>
        {error === 'password_required' ? '🔒' : error === 'gone' ? '🔥' : '❌'}
      </Text>
      <Text style={styles.errorTitle}>
        {error === 'password_required' ? 'Password required'
          : error === 'gone' ? 'No longer available'
          : 'Not found'}
      </Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>← Go back</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Code hero */}
      <View style={styles.hero}>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.meta}>
          {formatDate(clipboard?.created_at)} · {formatExpiry(clipboard?.expires_at)} · {clipboard?.view_count} views
        </Text>
      </View>

      {/* Content */}
      <View style={styles.card}>
        {editing ? (
          <>
            <TextInput
              style={styles.editInput}
              multiline
              value={editContent}
              onChangeText={setEditContent}
              autoFocus
              textAlignVertical="top"
            />
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
                {saving ? <ActivityIndicator color="#1a1a1a" size="small" />
                  : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : clipboard?.content ? (
          <>
            <Text style={styles.content}>{clipboard.content}</Text>
            <View style={styles.contentActions}>
              <TouchableOpacity onPress={copyContent} style={styles.actionBtn}>
                <Text style={styles.actionBtnText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.actionBtnOutline}>
                <Text style={styles.actionBtnOutlineText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Text style={styles.emptyText}>No content — tap to add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Badges */}
      <View style={styles.badgeRow}>
        {clipboard?.burn_after_read && (
          <View style={[styles.badge, styles.badgeBurn]}>
            <Text style={styles.badgeText}>🔥 Burn after read</Text>
          </View>
        )}
        {clipboard?.has_password && (
          <View style={[styles.badge, styles.badgeLock]}>
            <Text style={styles.badgeText}>🔒 Password protected</Text>
          </View>
        )}
        {clipboard?.is_encrypted && (
          <View style={[styles.badge, styles.badgeEncrypt]}>
            <Text style={styles.badgeText}>🔐 E2E encrypted</Text>
          </View>
        )}
      </View>

      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>Delete clipboard</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6', padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorEmoji: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  backBtn: { padding: 12 },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  hero: { paddingVertical: 16, marginBottom: 12 },
  code: { fontSize: 32, fontWeight: '900', fontFamily: 'monospace', color: '#111827', letterSpacing: 6 },
  meta: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#E5E7EB', padding: 16, marginBottom: 12,
  },
  content: { fontSize: 14, fontFamily: 'monospace', color: '#1F2937', lineHeight: 22 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 24 },
  contentActions: { flexDirection: 'row', gap: 8, marginTop: 14, borderTopWidth: 1, borderColor: '#F3F4F6', paddingTop: 12 },
  actionBtn: { flex: 1, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  actionBtnOutline: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  actionBtnOutlineText: { color: '#374151', fontWeight: '700', fontSize: 13 },
  editInput: {
    fontSize: 14, fontFamily: 'monospace', color: '#111827',
    minHeight: 160, lineHeight: 22, textAlignVertical: 'top',
  },
  editActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  saveBtn: { flex: 1, backgroundColor: '#F5C518', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  saveBtnText: { fontWeight: '800', color: '#1a1a1a', fontSize: 14 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: '#9CA3AF', fontWeight: '600', fontSize: 14 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  badgeBurn: { backgroundColor: '#FEE2E2' },
  badgeLock: { backgroundColor: '#FEF3C7' },
  badgeEncrypt: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  deleteBtn: { alignItems: 'center', paddingVertical: 16, marginBottom: 32 },
  deleteBtnText: { fontSize: 14, fontWeight: '600', color: '#EF4444' },
})
