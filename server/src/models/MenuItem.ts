import mongoose, { Schema, Document } from 'mongoose'

export interface IMenuItemOption {
    _id?: mongoose.Types.ObjectId
    name: string
    priceDelta: number
    isAvailable: boolean
}

export interface IMenuItemOptionGroup {
    _id?: mongoose.Types.ObjectId
    name: string
    minSelect: number
    maxSelect: number
    required: boolean
    options: IMenuItemOption[]
}

export interface IMenuItem extends Document {
    restaurantId: mongoose.Types.ObjectId
    menuCategoryId: mongoose.Types.ObjectId
    name: string
    slug: string
    shortDescription?: string | null
    description: string
    ingredients: string[]
    imageUrls: string[]
    basePrice: number
    salePrice?: number | null
    isAvailable: boolean
    isVisible: boolean
    soldCount: number
    optionGroups: IMenuItemOptionGroup[]
    createdAt: Date
    updatedAt: Date
    deletedAt?: Date | null
}

const menuItemOptionSchema = new Schema<IMenuItemOption>({
    name: { type: String, required: true, trim: true },
    priceDelta: { type: Number, required: true, default: 0 },
    isAvailable: { type: Boolean, default: true },
})

const menuItemOptionGroupSchema = new Schema<IMenuItemOptionGroup>({
    name: { type: String, required: true, trim: true },
    minSelect: { type: Number, required: true, min: 0, default: 1 },
    maxSelect: { type: Number, required: true, min: 1, default: 1 },
    required: { type: Boolean, default: false },
    options: [menuItemOptionSchema],
})

const menuItemSchema = new Schema<IMenuItem>(
    {
        restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
        menuCategoryId: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true, lowercase: true },
        shortDescription: { type: String, trim: true },
        description: { type: String, trim: true },
        ingredients: { type: [String], default: [] },
        imageUrls: { type: [String], default: [] },
        basePrice: { type: Number, required: true, min: 0 },
        salePrice: { type: Number, min: 0, default: null },
        isAvailable: { type: Boolean, default: true },
        isVisible: { type: Boolean, default: true },
        soldCount: { type: Number, default: 0 },
        optionGroups: { type: [menuItemOptionGroupSchema], default: [] },
        deletedAt: { type: Date, default: null },
    },
    { timestamps: true, collection: 'menuItems' }
)

menuItemSchema.index({ restaurantId: 1, menuCategoryId: 1, isVisible: 1, isAvailable: 1 })
menuItemSchema.index(
    { restaurantId: 1, slug: 1 },
    { unique: true, partialFilterExpression: { deletedAt: null } }
)
menuItemSchema.index({ name: 'text', description: 'text' })

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', menuItemSchema)
