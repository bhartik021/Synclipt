import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native'
import { clipboardApi } from '../api/clipboard'

export default function RetrieveScreen({ navigation }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  const handleRetrieve = async () => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) { Alert.alert('Invalid code', 'Enter a 6-character code'); return }
    setLoading(true)
    try {
      await clipboardApi.get(trimmed)
      navigation.navigate('ClipboardDetail', { code: trimmed })
    } catch (e) {
      const s = e.response?.status
      if (s === 403) {
        navigation.navigate('ClipboardDetail', { code: trimmed })
      } else {
        Alert.alert(
          s === 410 ? 'No longer available' : 'Not found',
          e.response?.data?.error || 'Could not retrieve clipboard'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Retrieve Clipboard</Text>
      <Text style={styles.subtitle}>Enter the 6-character code</Text>

      <View style={styles.card}>
        <TextInput
          ref={inputRef}
          style={styles.codeInput}
          placeholder="XXXXXX"
          placeholderTextColor="#D1D5DB"
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          onSubmitEditing={handleRetrieve}
          returnKeyType="go"
          autoFocus
        />

        <TouchableOpacity
          onPress={handleRetrieve}
          disabled={loading || code.length !== 6}
          style={[styles.btn, (loading || code.length !== 6) && styles.btnDisabled]}
        >
          {loading
            ? <ActivityIndicator color="#1a1a1a" />
            : <Text style={styles.btnText}>Retrieve →</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8F6', padding: 16, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 1,
    borderColor: '#E5E7EB', padding: 24, alignItems: 'center',
  },
  codeInput: {
    fontSize: 36, fontWeight: '900', fontFamily: 'monospace', color: '#111827',
    letterSpacing: 12, textAlign: 'center', marginBottom: 24,
    borderBottomWidth: 2, borderColor: '#F5C518', paddingBottom: 8, width: '100%',
  },
  btn: {
    backgroundColor: '#F5C518', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 40, alignItems: 'center', width: '100%',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontSize: 15, fontWeight: '800', color: '#1a1a1a' },
})
