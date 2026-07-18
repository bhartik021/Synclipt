import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { clipboardApi } from '../api/clipboard'

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '24 hours', value: 24 },
  { label: '7 days', value: 168 },
  { label: '30 days', value: 720 },
]

export default function HomeScreen({ navigation }) {
  const [content, setContent] = useState('')
  const [expiryHours, setExpiryHours] = useState(24)
  const [burnAfterRead, setBurnAfterRead] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!content.trim()) { Alert.alert('Empty', 'Please enter some content'); return }
    setLoading(true)
    try {
      const clipboard = await clipboardApi.create({
        content,
        expiry_hours: expiryHours,
        burn_after_read: burnAfterRead,
      })
      navigation.navigate('ClipboardDetail', { code: clipboard.code })
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to create clipboard')
    } finally {
      setLoading(false)
    }
  }

  const pasteFromClipboard = async () => {
    const text = await Clipboard.getStringAsync()
    if (text) setContent(text)
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Synclipt</Text>
        <Text style={styles.subtitle}>Share clipboard across devices instantly</Text>
      </View>

      <View style={styles.card}>
        <TextInput
          style={styles.textarea}
          multiline
          numberOfLines={8}
          placeholder="Paste or type content here…"
          placeholderTextColor="#9CA3AF"
          value={content}
          onChangeText={setContent}
          textAlignVertical="top"
        />
        <TouchableOpacity onPress={pasteFromClipboard} style={styles.pasteBtn}>
          <Text style={styles.pasteBtnText}>⌘ Paste from clipboard</Text>
        </TouchableOpacity>
      </View>

      {/* Expiry picker */}
      <View style={styles.optionRow}>
        <Text style={styles.optionLabel}>Expiry</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {EXPIRY_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.value}
              onPress={() => setExpiryHours(o.value)}
              style={[styles.chip, expiryHours === o.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, expiryHours === o.value && styles.chipTextActive]}>
                {o.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Burn toggle */}
      <TouchableOpacity
        onPress={() => setBurnAfterRead(!burnAfterRead)}
        style={styles.optionRow}
      >
        <Text style={styles.optionLabel}>Burn after read</Text>
        <View style={[styles.toggle, burnAfterRead && styles.toggleOn]}>
          <View style={[styles.toggleThumb, burnAfterRead && styles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleCreate}
        disabled={loading}
        style={[styles.createBtn, loading && styles.createBtnDisabled]}
      >
        {loading
          ? <ActivityIndicator color="#1a1a1a" />
          : <Text style={styles.createBtnText}>Create Clipboard →</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Retrieve')}
        style={styles.retrieveLink}
      >
        <Text style={styles.retrieveLinkText}>Already have a code? Retrieve →</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6', padding: 16 },
  header: { marginBottom: 20, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#E5E7EB', padding: 16, marginBottom: 16,
  },
  textarea: {
    fontSize: 14, fontFamily: 'monospace', color: '#111827',
    minHeight: 160, lineHeight: 22,
  },
  pasteBtn: { alignSelf: 'flex-end', marginTop: 8 },
  pasteBtnText: { fontSize: 12, fontWeight: '700', color: '#b8860b' },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: '#E5E7EB', padding: 14, marginBottom: 10,
  },
  optionLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#E5E7EB', marginLeft: 8, backgroundColor: '#F9FAFB',
  },
  chipActive: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#1a1a1a' },
  toggle: {
    width: 44, height: 24, borderRadius: 12, backgroundColor: '#E5E7EB',
    justifyContent: 'center', padding: 2,
  },
  toggleOn: { backgroundColor: '#EF4444' },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  createBtn: {
    backgroundColor: '#F5C518', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginBottom: 14,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
  retrieveLink: { alignItems: 'center', paddingBottom: 32 },
  retrieveLinkText: { fontSize: 13, fontWeight: '600', color: '#9CA3AF' },
})
