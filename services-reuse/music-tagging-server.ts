import axios, { AxiosInstance } from 'axios';
import { config } from 'dotenv';

config();

export class MusicTaggingServerService {
  private baseUrl: string;
  private client: AxiosInstance;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || process.env.MUSIC_TAGGING_SERVER || 'http://localhost:3000').replace(/\/$/, '');
    this.client = axios.create({ baseURL: this.baseUrl });
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
    this.client = axios.create({ baseURL: this.baseUrl });
  }

  resetBaseUrl() {
    this.setBaseUrl(process.env.MUSIC_TAGGING_SERVER || 'http://localhost:3000');
  }

  async getRoot() {
    return this.client.get('/');
  }

  async getStatus() {
    return this.client.get('/api/status');
  }

  async getHealth() {
    return this.client.get('/api/health');
  }

  async getFiles() {
    return this.client.get('/api/files');
  }

  async getFile(id: number) {
    return this.client.get(`/api/files/${id}`);
  }

  async uploadFile(data: FormData) {
    return this.client.post('/api/files/upload', data);
  }

  async deleteFile(id: number) {
    return this.client.delete(`/api/files/${id}`);
  }

  async moveFile(id: number, folderName: string) {
    return this.client.post(`/api/files/move/${id}/${folderName}`, {});
  }

  async moveMultipleFiles(ids: number[], folderName: string) {
    const idString = ids.join(',');
    return this.client.post(`/api/files/move-multiple/${idString}/${folderName}`, {});
  }

  async searchFilesByName(name: string) {
    return this.client.get(`/api/files/search/${encodeURIComponent(name)}`);
  }

  async getTags() {
    return this.client.get('/api/tags');
  }

  async getTag(id: number) {
    return this.client.get(`/api/tags/${id}`);
  }

  async createTag(data: { name: string }) {
    return this.client.post('/api/tags', data);
  }

  async updateTag(id: number, data: { name: string }) {
    return this.client.put(`/api/tags/${id}`, data);
  }

  async deleteTag(id: number) {
    return this.client.delete(`/api/tags/${id}`);
  }

  async createTagGroup(data: { name: string }) {
    return this.client.post('/api/tag-groups', data);
  }

  async getTagGroups() {
    return this.client.get('/api/tag-groups');
  }

  async getTagGroup(id: number) {
    return this.client.get(`/api/tag-groups/${id}`);
  }

  async updateTagGroup(id: number, data: { name: string }) {
    return this.client.put(`/api/tag-groups/${id}`, data);
  }

  async deleteTagGroup(id: number) {
    return this.client.delete(`/api/tag-groups/${id}`);
  }

  async getTagGroupTags() {
    return this.client.get('/api/tag-group-tags');
  }

  async getTagGroupTag(tagGroupId: number, tagId: number) {
    return this.client.get(`/api/tag-group-tags/${tagGroupId}/${tagId}`);
  }

  async createTagGroupTag(data: { tagGroupId: number; tagId: number }) {
    return this.client.post('/api/tag-group-tags', data);
  }

  async deleteTagGroupTag(tagGroupId: number, tagId: number) {
    return this.client.delete(`/api/tag-group-tags/${tagGroupId}/${tagId}`);
  }

  async getTopics() {
    return this.client.get('/api/topics');
  }

  async getTopic(id: number) {
    return this.client.get(`/api/topics/${id}`);
  }

  async createTopic(data: { name: string; description: string }) {
    return this.client.post('/api/topics', data);
  }

  async updateTopic(id: number, data: { name: string; description: string }) {
    return this.client.put(`/api/topics/${id}`, data);
  }

  async deleteTopic(id: number) {
    return this.client.delete(`/api/topics/${id}`);
  }

  async createTopicTagGroup(data: { topicId: number; tagGroupId: number }) {
    return this.client.post('/api/topic-tag-groups', data);
  }

  async getTopicTagGroups() {
    return this.client.get('/api/topic-tag-groups');
  }

  async getTopicTagGroup(topicId: number, tagGroupId: number) {
    return this.client.get(`/api/topic-tag-groups/${topicId}/${tagGroupId}`);
  }

  async deleteTopicTagGroup(topicId: number, tagGroupId: number) {
    return this.client.delete(`/api/topic-tag-groups/${topicId}/${tagGroupId}`);
  }

  async createItem(data: { name: string; link: string; imageUrl: string; type: string }) {
    return this.client.post('/api/items', data);
  }

  async getItems() {
    return this.client.get('/api/items');
  }

  async getItem(id: number) {
    return this.client.get(`/api/items/${id}`);
  }

  async updateItem(id: number, data: { name: string; link: string; imageUrl: string; type: string }) {
    return this.client.put(`/api/items/${id}`, data);
  }

  async deleteItem(id: number) {
    return this.client.delete(`/api/items/${id}`);
  }

  async getItemTags() {
    return this.client.get('/api/item-tags');
  }

  async getItemTag(itemId: number, tagId: number) {
    return this.client.get(`/api/item-tags/${itemId}/${tagId}`);
  }

  async createItemTag(data: { itemId: number; tagId: number }) {
    return this.client.post('/api/item-tags', data);
  }

  async deleteItemTag(itemId: number, tagId: number) {
    return this.client.delete(`/api/item-tags/${itemId}/${tagId}`);
  }

  async createTopicItem(data: { topicId: number; itemId: number }) {
    return this.client.post('/api/topic-items', data);
  }

  async getTopicItems() {
    return this.client.get('/api/topic-items');
  }

  async getTopicItem(topicId: number, itemId: number) {
    return this.client.get(`/api/topic-items/${topicId}/${itemId}`);
  }

  async deleteTopicItem(topicId: number, itemId: number) {
    return this.client.delete(`/api/topic-items/${topicId}/${itemId}`);
  }

  async getItemsByTopic(topicId: number) {
    return this.client.get(`/api/topics/${topicId}/items`);
  }

  async removeItemFromTopic(topicId: number, itemId: number) {
    return this.client.delete(`/api/topic-items/${topicId}/${itemId}`);
  }

  async addItemToTopic(topicId: number, itemId: number) {
    return this.createTopicItem({ topicId, itemId });
  }

  async moveItem(fromTopicId: number, toTopicId: number, itemId: number) {
    await this.removeItemFromTopic(fromTopicId, itemId);
    await this.addItemToTopic(toTopicId, itemId);
  }

  async moveItems(fromTopicId: number, toTopicId: number, itemIds: number[]) {
    for (const itemId of itemIds) {
      await this.moveItem(fromTopicId, toTopicId, itemId);
    }
  }

  async searchItems(query: string) {
    return this.client.get(`/api/items/search?q=${encodeURIComponent(query)}`);
  }

  async getUnassignedItems() {
    return this.client.get('/api/items/unassigned');
  }

  async backup() {
    return this.client.post('/api/backup/backup', {});
  }

  async getTagGroupsWithTags() {
    return this.client.get('/api/view/tag-groups');
  }

  async getTopicWithSchema(id: number) {
    return this.client.get(`/api/view/topics/${id}/schema`);
  }

  async getItemWithTags(id: number) {
    return this.client.get(`/api/view/items/${id}/tags`);
  }
}
