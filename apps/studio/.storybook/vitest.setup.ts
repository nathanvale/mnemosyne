// Replace your-framework with the framework you are using, e.g. react-vite, nextjs, nextjs-vite, etc.
import { setProjectAnnotations } from '@storybook/nextjs-vite'
import { beforeAll } from 'vitest'

import * as previewAnnotations from './preview'

const annotations = setProjectAnnotations([previewAnnotations])

// Run Storybook's beforeAll hook
beforeAll(annotations.beforeAll)
