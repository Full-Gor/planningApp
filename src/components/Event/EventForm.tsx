import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Event, EventCategory, ReminderSettings, RecurrenceSettings } from '../../types/Event';
import { useEventStore } from '../../store/eventStore';
import { LocationService } from '../../services/LocationService';
import { WeatherService } from '../../services/WeatherService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface EventFormProps {
  event?: Event;
  onSave: (event: Event) => void;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  onSave,
  onCancel,
}) => {
  const { categories, addEvent, updateEvent } = useEventStore();
  
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startDate, setStartDate] = useState(event?.startDate || new Date());
  const [endDate, setEndDate] = useState(event?.endDate || new Date(Date.now() + 60 * 60 * 1000));
  const [location, setLocation] = useState(event?.location || '');
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>(
    event?.category || categories[0]
  );
  const [isAllDay, setIsAllDay] = useState(event?.isAllDay || false);
  const [isPrivate, setIsPrivate] = useState(event?.isPrivate || false);
  const [tags, setTags] = useState(event?.tags?.join(', ') || '');
  const [attachments, setAttachments] = useState<string[]>(event?.attachments || []);
  const [reminder, setReminder] = useState<ReminderSettings>(
    event?.reminder || {
      enabled: false,
      minutes: [15],
      sound: true,
      vibration: true,
    }
  );
  const [recurrence, setRecurrence] = useState<RecurrenceSettings | undefined>(
    event?.recurrence
  );
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showRecurrenceSettings, setShowRecurrenceSettings] = useState(false);

  const colorPalettes = [
    { name: 'Classique', colors: ['#4285F4', '#DB4437', '#F4B400', '#0F9D58'] },
    { name: 'Pastel', colors: ['#A5D8FF', '#FFC9DE', '#FFE3A3', '#B2F2BB'] },
    { name: 'Sombre', colors: ['#4C6EF5', '#F03E3E', '#FAB005', '#2F9E44'] },
  ];
  const eventIcons = ['calendar', 'people', 'briefcase', 'school', 'airplane', 'fitness', 'restaurant', 'heart'];
  const themes = [
    { id: 'default', name: 'Par défaut', bg: '#ffffff', text: '#2d4150' },
    { id: 'dark', name: 'Sombre', bg: '#1f2937', text: '#e5e7eb' },
    { id: 'sunset', name: 'Coucher de soleil', bg: '#FFF3E0', text: '#7C3A00' },
  ];
  const [selectedThemeId, setSelectedThemeId] = useState('default');

  useEffect(() => {
    if (isAllDay) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      setStartDate(start);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      setEndDate(end);
    }
  }, [isAllDay]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est obligatoire');
      return;
    }

    if (startDate >= endDate) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début');
      return;
    }

    const eventData: Event = {
      id: event?.id || Date.now().toString(),
      title: title.trim(),
      description: description.trim() || undefined,
      startDate,
      endDate,
      location: location.trim() || undefined,
      category: selectedCategory,
      color: selectedCategory.color,
      // on pourrait stocker le thème choisi dans tags ou un champ dédié si on l’ajoute au type
      isAllDay,
      reminder: reminder.enabled ? reminder : undefined,
      recurrence,
      participants: event?.participants || [],
      createdBy: event?.createdBy || 'user',
      createdAt: event?.createdAt || new Date(),
      updatedAt: new Date(),
      isPrivate,
      tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      attachments,
    };

    // Ajouter les informations météo si l'événement a un lieu
    if (location.trim()) {
      try {
        const locationInfo = await LocationService.geocodeAddress(location);
        if (locationInfo) {
          const weather = await WeatherService.getWeatherForLocation(
            locationInfo.latitude,
            locationInfo.longitude,
            startDate
          );
          if (weather) {
            eventData.weather = weather;
          }
        }
      } catch (error) {
        console.log('Impossible de récupérer les informations météo');
      }
    }

    if (event) {
      updateEvent(event.id, eventData);
      onSave(eventData);
    } else {
      addEvent(eventData);
      onSave(eventData);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const locationInfo = await LocationService.getCurrentLocation();
      if (locationInfo && locationInfo.address) {
        setLocation(locationInfo.address);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de récupérer la localisation');
    }
  };

  const renderCategoryPicker = () => (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerTitle}>Choisir une catégorie</Text>
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryOption,
            selectedCategory.id === category.id && styles.selectedCategoryOption,
          ]}
          onPress={() => {
            setSelectedCategory(category);
            setShowCategoryPicker(false);
          }}
        >
          <View style={[styles.categoryColor, { backgroundColor: category.color }]} />
          <Ionicons name={category.icon as any} size={20} color={category.color} />
          <Text style={styles.categoryName}>{category.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderReminderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Paramètres de rappel</Text>
      
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Activer les rappels</Text>
        <Switch
          value={reminder.enabled}
          onValueChange={(value) => setReminder({ ...reminder, enabled: value })}
        />
      </View>

      {reminder.enabled && (
        <>
          <Text style={styles.subTitle}>Minutes avant l'événement :</Text>
          {[5, 15, 30, 60, 120, 1440].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={styles.reminderOption}
              onPress={() => {
                const newMinutes = reminder.minutes.includes(minutes)
                  ? reminder.minutes.filter(m => m !== minutes)
                  : [...reminder.minutes, minutes];
                setReminder({ ...reminder, minutes: newMinutes });
              }}
            >
              <Ionicons
                name={reminder.minutes.includes(minutes) ? 'checkbox' : 'square-outline'}
                size={20}
                color="#4285F4"
              />
              <Text style={styles.reminderText}>
                {minutes < 60 ? `${minutes} min` : 
                 minutes < 1440 ? `${minutes / 60}h` : '1 jour'}
              </Text>
            </TouchableOpacity>
          ))}

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Son</Text>
            <Switch
              value={reminder.sound}
              onValueChange={(value) => setReminder({ ...reminder, sound: value })}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Vibration</Text>
            <Switch
              value={reminder.vibration}
              onValueChange={(value) => setReminder({ ...reminder, vibration: value })}
            />
          </View>
        </>
      )}
    </View>
  );

  const renderRecurrenceSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.settingsTitle}>Répétition</Text>
      
      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Événement récurrent</Text>
        <Switch
          value={!!recurrence}
          onValueChange={(value) => {
            if (value) {
              setRecurrence({
                type: 'weekly',
                interval: 1,
              });
            } else {
              setRecurrence(undefined);
            }
          }}
        />
      </View>

      {recurrence && (
        <>
          <Text style={styles.subTitle}>Type de répétition :</Text>
          {[
            { type: 'daily', label: 'Quotidien' },
            { type: 'weekly', label: 'Hebdomadaire' },
            { type: 'monthly', label: 'Mensuel' },
            { type: 'yearly', label: 'Annuel' },
          ].map(({ type, label }) => (
            <TouchableOpacity
              key={type}
              style={styles.recurrenceOption}
              onPress={() => setRecurrence({ ...recurrence, type: type as any })}
            >
              <Ionicons
                name={recurrence.type === type ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color="#4285F4"
              />
              <Text style={styles.recurrenceText}>{label}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Intervalle :</Text>
            <TextInput
              style={styles.intervalInput}
              value={recurrence.interval.toString()}
              onChangeText={(text) => {
                const interval = parseInt(text) || 1;
                setRecurrence({ ...recurrence, interval });
              }}
              keyboardType="numeric"
              placeholder="1"
            />
          </View>
        </>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color="#6c757d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {event ? 'Modifier l\'événement' : 'Nouvel événement'}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Titre de l'événement"
            placeholderTextColor="#6c757d"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Description (optionnelle)"
            placeholderTextColor="#6c757d"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Toute la journée</Text>
          <Switch value={isAllDay} onValueChange={setIsAllDay} />
        </View>

        <View style={styles.dateTimeRow}>
          <View style={styles.dateTimeGroup}>
            <Text style={styles.label}>Début</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#4285F4" />
              <Text style={styles.dateTimeText}>
                {format(startDate, 'dd/MM/yyyy', { locale: fr })}
              </Text>
            </TouchableOpacity>
            {!isAllDay && (
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Ionicons name="time" size={20} color="#4285F4" />
                <Text style={styles.dateTimeText}>
                  {format(startDate, 'HH:mm')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dateTimeGroup}>
            <Text style={styles.label}>Fin</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#4285F4" />
              <Text style={styles.dateTimeText}>
                {format(endDate, 'dd/MM/yyyy', { locale: fr })}
              </Text>
            </TouchableOpacity>
            {!isAllDay && (
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Ionicons name="time" size={20} color="#4285F4" />
                <Text style={styles.dateTimeText}>
                  {format(endDate, 'HH:mm')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Lieu</Text>
          <View style={styles.locationRow}>
            <TextInput
              style={[styles.input, styles.locationInput]}
              value={location}
              onChangeText={setLocation}
              placeholder="Ajouter un lieu"
              placeholderTextColor="#6c757d"
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
            >
              <Ionicons name="location" size={20} color="#4285F4" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Catégorie</Text>
          <TouchableOpacity
            style={styles.categoryButton}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <View style={[styles.categoryColor, { backgroundColor: selectedCategory.color }]} />
            <Ionicons name={selectedCategory.icon as any} size={20} color={selectedCategory.color} />
            <Text style={styles.categoryButtonText}>{selectedCategory.name}</Text>
            <Ionicons name="chevron-down" size={20} color="#6c757d" />
          </TouchableOpacity>
          {showCategoryPicker && renderCategoryPicker()}
        </View>

        {/* Couleurs, icônes et thème */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Couleurs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 4 }}>
            {colorPalettes.flatMap(p => p.colors).map((c) => (
              <TouchableOpacity key={c} onPress={() => setSelectedCategory({ ...selectedCategory, color: c })} style={{ marginRight: 8 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: c, borderWidth: 1, borderColor: '#e9ecef' }} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Icône</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 4 }}>
            {eventIcons.map((ic) => (
              <TouchableOpacity key={ic} onPress={() => setSelectedCategory({ ...selectedCategory, icon: ic })} style={{ marginRight: 12, padding: 8, borderWidth: 1, borderColor: '#e9ecef', borderRadius: 8 }}>
                <Ionicons name={ic as any} size={20} color={selectedCategory.color} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Thème de l’évènement</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 4 }}>
            {themes.map((t) => (
              <TouchableOpacity key={t.id} onPress={() => setSelectedThemeId(t.id)} style={{ marginRight: 12, padding: 8, borderWidth: 1, borderColor: selectedThemeId === t.id ? '#4285F4' : '#e9ecef', borderRadius: 8, backgroundColor: t.bg }}>
                <Text style={{ color: t.text }}>{t.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="Tags séparés par des virgules"
            placeholderTextColor="#6c757d"
          />
        </View>

        {/* Pièces jointes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Pièces jointes</Text>
          <View style={styles.attachActionsRow}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={async () => {
                try {
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    allowsMultipleSelection: true,
                    quality: 0.8,
                  });
                  if (!result.canceled) {
                    const uris = (result.assets || []).map(a => a.uri).filter(Boolean) as string[];
                    setAttachments(prev => [...prev, ...uris]);
                  }
                } catch {}
              }}
            >
              <Ionicons name="image" size={18} color="#4285F4" />
              <Text style={styles.attachButtonText}>Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.attachButton}
              onPress={async () => {
                try {
                  const res = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
                  if ((res as any).assets && (res as any).assets.length > 0) {
                    const uris = (res as any).assets.map((a: any) => a.uri).filter(Boolean) as string[];
                    setAttachments(prev => [...prev, ...uris]);
                  } else if ('uri' in (res as any) && (res as any).uri) {
                    setAttachments(prev => [...prev, (res as any).uri]);
                  }
                } catch {}
              }}
            >
              <Ionicons name="document" size={18} color="#4285F4" />
              <Text style={styles.attachButtonText}>Fichier</Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.attachmentsList}>
              {attachments.map((uri, idx) => {
                const lower = (uri || '').toLowerCase();
                const isImg = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp');
                return (
                  <View key={(uri || '') + idx} style={styles.attachmentItem}>
                    {isImg ? (
                      <Image source={{ uri }} style={styles.attachmentThumb} resizeMode="cover" />
                    ) : (
                      <View style={styles.attachmentFile}>
                        <Ionicons name="document" size={20} color="#6c757d" />
                        <Text numberOfLines={1} style={styles.attachmentName}>{(uri || '').split('/').pop() || 'fichier'}</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={styles.removeAttachment}
                      onPress={() => setAttachments(prev => prev.filter((u, i) => i !== idx))}
                    >
                      <Ionicons name="close" size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Événement privé</Text>
          <Switch value={isPrivate} onValueChange={setIsPrivate} />
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowReminderSettings(!showReminderSettings)}
        >
          <Ionicons name="notifications" size={20} color="#4285F4" />
          <Text style={styles.settingsButtonText}>Rappels</Text>
          <Ionicons
            name={showReminderSettings ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6c757d"
          />
        </TouchableOpacity>
        {showReminderSettings && renderReminderSettings()}

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowRecurrenceSettings(!showRecurrenceSettings)}
        >
          <Ionicons name="repeat" size={20} color="#4285F4" />
          <Text style={styles.settingsButtonText}>Répétition</Text>
          <Ionicons
            name={showRecurrenceSettings ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#6c757d"
          />
        </TouchableOpacity>
        {showRecurrenceSettings && renderRecurrenceSettings()}
      </View>

      {/* Date/Time Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startDate}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartTimePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endDate}
          mode="time"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndTimePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  cancelButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  saveButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2d4150',
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2d4150',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateTimeGroup: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  dateTimeText: {
    fontSize: 16,
    color: '#2d4150',
    marginLeft: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    marginRight: 8,
  },
  locationButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#ffffff',
  },
  categoryColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  categoryButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2d4150',
    marginLeft: 8,
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedCategoryOption: {
    backgroundColor: '#e3f2fd',
  },
  categoryName: {
    fontSize: 16,
    color: '#2d4150',
    marginLeft: 8,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  settingsButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#2d4150',
    marginLeft: 8,
  },
  attachmentsList: {
    marginTop: 8,
  },
  attachmentItem: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginRight: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ffffff',
  },
  attachmentThumb: {
    width: '100%',
    height: '100%',
  },
  removeAttachment: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DB4437',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentFile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  attachmentName: {
    fontSize: 10,
    color: '#6c757d',
    marginTop: 2,
    textAlign: 'center',
    width: 64,
  },
  attachActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#ffffff',
  },
  attachButtonText: {
    marginLeft: 6,
    color: '#2d4150',
  },
  settingsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 8,
    marginTop: 12,
  },
  reminderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 4,
  },
  reminderText: {
    fontSize: 16,
    color: '#2d4150',
    marginLeft: 8,
  },
  recurrenceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 4,
  },
  recurrenceText: {
    fontSize: 16,
    color: '#2d4150',
    marginLeft: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  inputLabel: {
    fontSize: 16,
    color: '#2d4150',
    marginRight: 12,
  },
  intervalInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: '#2d4150',
    backgroundColor: '#ffffff',
    width: 60,
    textAlign: 'center',
  },
});